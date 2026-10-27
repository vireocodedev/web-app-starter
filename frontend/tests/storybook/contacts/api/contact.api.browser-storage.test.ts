import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactConflictError } from "../../../../docs/storybook/examples/Contacts/api/contact.api";
import { ContactApiBrowserStorage } from "../../../../docs/storybook/examples/Contacts/api/contact.api.browser-storage";
import {
  contactStorage,
  contactStorageKey,
  contactStorageRecoveryKey,
} from "../../../../docs/storybook/examples/Contacts/api/contact.storage";
import { createDefaultContacts } from "../../../../docs/storybook/examples/Contacts/api/contact.defaults";

describe("ContactApiBrowserStorage", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    contactStorage.set(contactStorageKey, createDefaultContacts());
  });

  it("persists create, update, and delete operations in browser storage", async () => {
    const api = new ContactApiBrowserStorage(() => "new-contact");

    const created = await api.create({
      email: "new@example.com",
      name: "New Contact",
      organization: "Example",
      role: "Developer",
      status: "ACTIVE",
    });
    expect(created.id).toBe("new-contact");

    await api.update({ contact: { ...created, role: "Engineering lead" }, expected: created });
    expect(await api.findAll()).toContainEqual({
      ...created,
      role: "Engineering lead",
    });

    await api.remove(created.id);
    expect(await api.findAll()).not.toContainEqual(expect.objectContaining({ id: created.id }));
    expect(contactStorage.get(contactStorageKey)).toHaveLength(3);
  });

  it("reads mixed legacy statuses without losing contacts and writes uppercase statuses", async () => {
    const defaults = createDefaultContacts();
    const legacy = { ...defaults[0]!, status: "active" };
    const current = defaults[2]!;
    globalThis.localStorage.setItem(contactStorageKey, JSON.stringify([legacy, current]));
    const api = new ContactApiBrowserStorage(() => "new-contact");

    expect(await api.findAll()).toEqual([{ ...legacy, status: "ACTIVE" }, current]);

    await api.create({
      email: "new@example.com",
      name: "New Contact",
      organization: "Example",
      role: "Developer",
      status: "ACTIVE",
    });
    expect(JSON.parse(globalThis.localStorage.getItem(contactStorageKey) ?? "null")).toEqual([
      { ...legacy, status: "ACTIVE" },
      current,
      {
        email: "new@example.com",
        id: "new-contact",
        name: "New Contact",
        organization: "Example",
        role: "Developer",
        status: "ACTIVE",
      },
    ]);
  });

  it("returns copies so callers cannot mutate persisted contacts", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const contacts = await api.findAll();
    contacts[0]!.name = "Changed outside the adapter";

    expect((await api.findAll())[0]!.name).toBe("Ana Horvat");
  });

  it("rejects updates and removals for missing contacts", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const missing = {
      email: "missing@example.com",
      id: "missing",
      name: "Missing",
      organization: "Example",
      role: "Developer",
      status: "INACTIVE" as const,
    };

    await expect(api.update({ contact: missing, expected: missing })).rejects.toThrow("does not exist");
    await expect(api.remove(missing.id)).rejects.toThrow("does not exist");
  });

  it("updates statuses and removes batches with one atomic storage result", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const contacts = await api.findAll();
    const updated = contacts.slice(0, 2).map(contact => ({ ...contact, status: "INACTIVE" as const }));
    const ids = updated.map(({ id }) => id);

    await expect(api.updateStatusMany({ ids, status: "INACTIVE" })).resolves.toEqual(updated);
    expect((await api.findAll()).slice(0, 2)).toEqual(updated);

    await api.removeMany(ids);
    expect(await api.findAll()).toEqual([contacts[2]]);
  });

  it("does not partially write a batch when any contact is missing", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const before = await api.findAll();
    await expect(api.updateStatusMany({ ids: [before[0]!.id, "missing"], status: "INACTIVE" })).rejects.toThrow(
      "does not exist",
    );
    expect(await api.findAll()).toEqual(before);

    await expect(api.removeMany([before[0]!.id, "missing"])).rejects.toThrow("does not exist");
    expect(await api.findAll()).toEqual(before);
  });

  it("does not commit a mutation aborted before its queued turn", async () => {
    const api = new ContactApiBrowserStorage(() => "aborted-contact");
    const before = await api.findAll();
    const controller = new AbortController();
    const creation = api.create(
      {
        email: "aborted@example.com",
        name: "Aborted Contact",
        organization: "Example",
        role: "Developer",
        status: "ACTIVE",
      },
      { signal: controller.signal },
    );
    controller.abort();

    await expect(creation).rejects.toMatchObject({ name: "AbortError" });
    expect(await api.findAll()).toEqual(before);
  });

  it("serializes overlapping creates against the latest stored snapshot", async () => {
    const ids = ["first-created", "second-created"];
    const api = new ContactApiBrowserStorage(() => ids.shift() ?? "unexpected");

    const [first, second] = await Promise.all([
      api.create({
        email: "first@example.com",
        name: "First",
        organization: "Example",
        role: "Developer",
        status: "ACTIVE",
      }),
      api.create({
        email: "second@example.com",
        name: "Second",
        organization: "Example",
        role: "Designer",
        status: "INACTIVE",
      }),
    ]);

    expect((await api.findAll()).slice(-2)).toEqual([first, second]);
  });

  it("preserves cross-method order and continues after a rejected mutation", async () => {
    const api = new ContactApiBrowserStorage(() => "queued-contact");
    const create = api.create({
      email: "queued@example.com",
      name: "Queued",
      organization: "Example",
      role: "Developer",
      status: "ACTIVE",
    });
    const remove = api.remove("queued-contact");
    const rejected = api.remove("missing");
    const finalCreate = api.create({
      email: "after@example.com",
      name: "After rejection",
      organization: "Example",
      role: "Designer",
      status: "INACTIVE",
    });

    await expect(create).resolves.toMatchObject({ id: "queued-contact" });
    await expect(remove).resolves.toBeUndefined();
    await expect(rejected).rejects.toThrow("does not exist");
    await expect(finalCreate).resolves.toMatchObject({ name: "After rejection" });
    expect(await api.findAll()).toContainEqual(expect.objectContaining({ name: "After rejection" }));
  });

  it("serializes single and batch mutations in invocation order", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const contacts = await api.findAll();
    const update = api.update({ contact: { ...contacts[0]!, role: "Lead" }, expected: contacts[0]! });
    const updateStatusMany = api.updateStatusMany({ ids: [contacts[1]!.id], status: "INACTIVE" });
    const remove = api.remove(contacts[2]!.id);
    const removeMany = api.removeMany([contacts[0]!.id]);

    await update;
    await updateStatusMany;
    await remove;
    await removeMany;

    expect(await api.findAll()).toEqual([{ ...contacts[1]!, status: "INACTIVE" }]);
  });

  it("does not roll back a mutation when its signal aborts after commit", async () => {
    const controller = new AbortController();
    const api = new ContactApiBrowserStorage(() => "committed-contact");
    await api.create(
      {
        email: "committed@example.com",
        name: "Committed",
        organization: "Example",
        role: "Developer",
        status: "ACTIVE",
      },
      { signal: controller.signal },
    );

    controller.abort();

    expect(await api.findAll()).toContainEqual(expect.objectContaining({ id: "committed-contact" }));
  });

  it("returns copies from status mutations", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const contacts = await api.findAll();
    const result = await api.updateStatusMany({ ids: [contacts[0]!.id], status: "INACTIVE" });
    result[0]!.role = "Changed outside the adapter";

    expect((await api.findAll())[0]!.role).toBe(contacts[0]!.role);
  });

  it("applies a queued status change to the latest record without reverting other fields", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const before = (await api.findAll())[0]!;
    const edit = api.update({ contact: { ...before, role: "Lead" }, expected: before });
    const status = api.updateStatusMany({ ids: [before.id], status: "INACTIVE" });

    await Promise.all([edit, status]);
    expect((await api.findAll())[0]).toEqual({ ...before, role: "Lead", status: "INACTIVE" });
  });

  it("rejects a stale full save after a newer status command", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const before = (await api.findAll())[0]!;
    await api.updateStatusMany({ ids: [before.id], status: "INACTIVE" });

    await expect(api.update({ contact: { ...before, role: "Lead" }, expected: before })).rejects.toBeInstanceOf(
      ContactConflictError,
    );
    expect((await api.findAll())[0]).toEqual({ ...before, status: "INACTIVE" });
  });

  it("rejects invalid create, update, and batch values without changing storage", async () => {
    const api = new ContactApiBrowserStorage(() => "unused");
    const before = await api.findAll();

    await expect(api.create({ ...before[0]!, name: "   " })).rejects.toThrow();
    await expect(api.update({ contact: { ...before[0]!, email: "invalid" }, expected: before[0]! })).rejects.toThrow();
    await expect(api.updateStatusMany({ ids: [before[0]!.id], status: "INVALID" as never })).rejects.toThrow();
    expect(await api.findAll()).toEqual(before);
  });

  it("recovers valid neighbors and archives invalid legacy values before allowing writes", async () => {
    const valid = createDefaultContacts()[0]!;
    const invalid = { ...createDefaultContacts()[1]!, email: "invalid" };
    const raw = JSON.stringify([valid, invalid]);
    globalThis.localStorage.setItem(contactStorageKey, raw);
    const api = new ContactApiBrowserStorage(() => "unused");

    expect(await api.findAll()).toEqual([valid]);
    expect(contactStorage.get(contactStorageRecoveryKey)).toEqual([[valid, invalid]]);
    expect(JSON.parse(globalThis.localStorage.getItem(contactStorageKey) ?? "null")).toEqual([valid]);

    await api.update({ contact: { ...valid, role: "Lead" }, expected: valid });
    expect(await api.findAll()).toEqual([{ ...valid, role: "Lead" }]);
    expect(contactStorage.get(contactStorageRecoveryKey)).toEqual([[valid, invalid]]);
  });

  it("retains earlier recovery snapshots when a later invalid array appears", async () => {
    const contacts = createDefaultContacts();
    const first = JSON.stringify([{ ...contacts[0]!, email: "invalid" }, contacts[1]!]);
    globalThis.localStorage.setItem(contactStorageKey, first);
    const api = new ContactApiBrowserStorage(() => "unused");
    expect(await api.findAll()).toEqual([contacts[1]]);

    const second = JSON.stringify([contacts[0]!, { ...contacts[2]!, name: "   " }]);
    globalThis.localStorage.setItem(contactStorageKey, second);
    expect(await api.findAll()).toEqual([contacts[0]]);
    expect(contactStorage.get(contactStorageRecoveryKey)).toEqual([JSON.parse(first), JSON.parse(second)]);
  });

  it("leaves the primary array untouched if its recovery archive cannot be written", async () => {
    const contacts = createDefaultContacts();
    const raw = JSON.stringify([contacts[0]!, { ...contacts[1]!, email: "invalid" }]);
    globalThis.localStorage.setItem(contactStorageKey, raw);
    const setItem = Storage.prototype.setItem;
    const archive = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === contactStorageRecoveryKey) throw new Error("storage full");
      return setItem.call(this, key, value);
    });
    const api = new ContactApiBrowserStorage(() => "unused");
    try {
      await expect(api.findAll()).rejects.toThrow("storage full");
      expect(globalThis.localStorage.getItem(contactStorageKey)).toBe(raw);
      expect(globalThis.localStorage.getItem(contactStorageRecoveryKey)).toBeNull();
    } finally {
      archive.mockRestore();
    }
  });
});
