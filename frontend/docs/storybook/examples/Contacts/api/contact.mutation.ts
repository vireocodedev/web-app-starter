import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import type { ContactApi, ContactStatusUpdate, ContactUpdate } from "./contact.api";
import { ContactQueryKey } from "./contact.querykeys";
import type { ContactInput } from "../models/Contact";

/** Mutations refresh only the Contacts collection they can change. */
export function createContactMutation(api: ContactApi, queryClient: QueryClient) {
  const refreshContacts = () => queryClient.invalidateQueries({ queryKey: ContactQueryKey.collection() });

  return Object.freeze({
    create: () =>
      mutationOptions({
        mutationFn: (contact: ContactInput) => api.create(contact),
        onSuccess: refreshContacts,
      }),
    remove: () =>
      mutationOptions({
        mutationFn: (contactId: string) => api.remove(contactId),
        onSuccess: refreshContacts,
      }),
    removeMany: () =>
      mutationOptions({
        mutationFn: (contactIds: readonly string[]) => api.removeMany(contactIds),
        onSuccess: refreshContacts,
      }),
    update: () =>
      mutationOptions({
        mutationFn: (update: ContactUpdate) => api.update(update),
        onSuccess: refreshContacts,
      }),
    updateStatusMany: () =>
      mutationOptions({
        mutationFn: (update: ContactStatusUpdate) => api.updateStatusMany(update),
        onSuccess: refreshContacts,
      }),
  });
}

export type ContactMutation = ReturnType<typeof createContactMutation>;
