import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { ContactApi } from "../../../../docs/storybook/examples/Contacts/api/contact.api";
import { createContactMutation } from "../../../../docs/storybook/examples/Contacts/api/contact.mutation";
import { ContactQueryKey } from "../../../../docs/storybook/examples/Contacts/api/contact.querykeys";

const contact = {
  email: "ana@example.com",
  id: "ana",
  name: "Ana",
  organization: "RGO",
  role: "Designer",
  status: "ACTIVE" as const,
};

function createApi(): ContactApi {
  return {
    create: vi.fn(async input => ({ ...input, id: "created" })),
    findAll: vi.fn(async () => [contact]),
    remove: vi.fn(async () => undefined),
    removeMany: vi.fn(async () => undefined),
    update: vi.fn(async ({ contact }) => contact),
    updateStatusMany: vi.fn(async ({ ids, status }: Parameters<ContactApi["updateStatusMany"]>[0]) =>
      ids.map(id => ({ ...contact, id, status })),
    ),
  };
}

describe("createContactMutation", () => {
  it.each(["create", "update", "remove", "updateStatusMany", "removeMany"] as const)(
    "invalidates only the Contacts collection after %s succeeds",
    async operation => {
      const queryClient = new QueryClient();
      const collectionKey = ContactQueryKey.collection();
      queryClient.setQueryData(collectionKey, [contact]);
      const unrelatedKey = ["unrelated", "collection"] as const;
      queryClient.setQueryData(unrelatedKey, ["untouched"]);
      const mutations = createContactMutation(createApi(), queryClient);

      if (operation === "create") {
        const observer = new MutationObserver(queryClient, mutations.create());
        await observer.mutate({
          email: contact.email,
          name: contact.name,
          organization: contact.organization,
          role: contact.role,
          status: contact.status,
        });
      } else if (operation === "update") {
        const observer = new MutationObserver(queryClient, mutations.update());
        await observer.mutate({ contact, expected: contact });
      } else if (operation === "remove") {
        const observer = new MutationObserver(queryClient, mutations.remove());
        await observer.mutate(contact.id);
      } else if (operation === "updateStatusMany") {
        const observer = new MutationObserver(queryClient, mutations.updateStatusMany());
        await observer.mutate({ ids: [contact.id], status: "INACTIVE" });
      } else {
        const observer = new MutationObserver(queryClient, mutations.removeMany());
        await observer.mutate([contact.id]);
      }

      expect(queryClient.getQueryState(collectionKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    },
  );
  it("does not invalidate Contacts or unrelated queries after a rejected write", async () => {
    const queryClient = new QueryClient();
    const collectionKey = ContactQueryKey.collection();
    const unrelatedKey = ["unrelated", "collection"] as const;
    queryClient.setQueryData(collectionKey, [contact]);
    queryClient.setQueryData(unrelatedKey, ["untouched"]);
    const api = createApi();
    vi.spyOn(api, "updateStatusMany").mockRejectedValue(new Error("save failed"));
    const observer = new MutationObserver(queryClient, createContactMutation(api, queryClient).updateStatusMany());

    await expect(observer.mutate({ ids: [contact.id], status: "INACTIVE" })).rejects.toThrow("save failed");
    expect(queryClient.getQueryState(collectionKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});
