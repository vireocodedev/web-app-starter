import {
  ContactConflictError,
  type ContactApi,
  type ContactRequestOptions,
} from "../../examples/Contacts/api/contact.api";
import { contactSchema, type Contact } from "../../examples/Contacts/models/Contact";
import { contactStatusSchema } from "../../examples/Contacts/models/ContactStatus";

export type FeatureDataScenario = "overview" | "readFailure" | "saveFailure" | "empty" | "cancellation";

const initialContact: Contact = {
  id: "preview-contact-1",
  name: "Alex Morgan",
  email: "alex@example.com",
  organization: "Example Studio",
  role: "Designer",
  status: "ACTIVE",
};

/** Implements the real port without touching application storage or the network. */
export function createFeatureDataFixture(scenario: FeatureDataScenario) {
  let contacts: Contact[] = scenario === "empty" ? [] : [{ ...initialContact }];
  let nextId = 2;
  let failRead = scenario === "readFailure";
  let failSave = scenario === "saveFailure";
  let events: readonly string[] = [];
  const listeners = new Set<() => void>();
  const pending = new Set<() => void>();
  const record = (event: string) => {
    events = [...events.slice(-7), event];
    listeners.forEach(listener => listener());
  };

  function wait(milliseconds: number, options?: ContactRequestOptions, reading = false) {
    return new Promise<void>((resolve, reject) => {
      if (options?.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }
      const finish = () => {
        options?.signal?.removeEventListener("abort", abort);
        pending.delete(abort);
      };
      const abort = () => {
        window.clearTimeout(timer);
        finish();
        if (reading) record("Read canceled before completion.");
        reject(new DOMException("The preview operation was canceled.", "AbortError"));
      };
      const timer = window.setTimeout(() => {
        finish();
        resolve();
      }, milliseconds);
      pending.add(abort);
      options?.signal?.addEventListener("abort", abort, { once: true });
    });
  }

  const api: ContactApi = {
    async findAll(options) {
      record("Collection read started.");
      await wait(scenario === "cancellation" ? 2500 : 500, options, true);
      options?.signal?.throwIfAborted();
      if (failRead) {
        failRead = false;
        record("Collection read rejected; retry is available.");
        throw new Error("Simulated read failure.");
      }
      record("Collection read completed.");
      return contacts.map(contact => ({ ...contact }));
    },
    async create(input, options) {
      await wait(600, options);
      options?.signal?.throwIfAborted();
      if (failSave) {
        failSave = false;
        record("Write rejected before changing the collection.");
        throw new Error("Simulated write rejection before commit.");
      }
      const saved = contactSchema.parse({ ...input, id: `preview-contact-${nextId++}` });
      contacts = [...contacts, saved];
      record("Write acknowledged; the mutation invalidates the collection.");
      return { ...saved };
    },
    async update({ contact, expected }, options) {
      await wait(600, options);
      options?.signal?.throwIfAborted();
      const saved = contactSchema.parse(contact);
      const baseline = contactSchema.parse(expected);
      if (saved.id !== baseline.id) throw new Error("The contact and baseline must have the same ID.");
      const current = contacts.find(item => item.id === saved.id);
      if (!current) throw new Error("Contact not found.");
      if (Object.keys(baseline).some(key => current[key as keyof Contact] !== baseline[key as keyof Contact])) {
        throw new ContactConflictError(saved.id);
      }
      contacts = contacts.map(item => (item.id === saved.id ? saved : item));
      return { ...saved };
    },
    async updateStatusMany({ ids, status }, options) {
      await wait(600, options);
      options?.signal?.throwIfAborted();
      const requestedStatus = contactStatusSchema.parse(status);
      if (ids.some(id => !contacts.some(contact => contact.id === id))) throw new Error("Contact not found.");
      contacts = contacts.map(contact =>
        ids.includes(contact.id) ? { ...contact, status: requestedStatus } : contact,
      );
      return contacts.filter(contact => ids.includes(contact.id)).map(contact => ({ ...contact }));
    },
    async remove(id, options) {
      await api.removeMany([id], options);
    },
    async removeMany(ids, options) {
      await wait(600, options);
      options?.signal?.throwIfAborted();
      if (ids.some(id => !contacts.some(contact => contact.id === id))) throw new Error("Contact not found.");
      contacts = contacts.filter(contact => !ids.includes(contact.id));
    },
  };

  return {
    api,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getEvents: () => events,
    cancelPending() {
      [...pending].forEach(cancel => cancel());
    },
  };
}
