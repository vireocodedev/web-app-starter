import type { QueryClient } from "@tanstack/react-query";

import type { ContactApi } from "./api/contact.api";
import { createContactMutation } from "./api/contact.mutation";
import { createContactQuery } from "./api/contact.query";

type CreateContactsFeatureOptions = Readonly<{ queryClient: QueryClient; api: ContactApi }>;

/** Creates the Contacts feature's explicit reference runtime. */
export function createContactsFeature({ queryClient, api }: CreateContactsFeatureOptions) {
  return Object.freeze({
    ContactMutation: createContactMutation(api, queryClient),
    ContactQuery: createContactQuery(api),
  });
}

export type ContactsFeature = ReturnType<typeof createContactsFeature>;
