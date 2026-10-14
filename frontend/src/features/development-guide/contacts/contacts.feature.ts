import type { QueryClient } from "@tanstack/react-query";

import { ContactApiBrowserStorage } from "./api/contact.api.browser-storage";
import { createContactMutation } from "./api/contact.mutation";
import { createContactQuery } from "./api/contact.query";

type CreateContactsFeatureOptions = Readonly<{ queryClient: QueryClient }>;

/** Creates the Contacts feature's explicit, application-owned runtime. */
export function createContactsFeature({ queryClient }: CreateContactsFeatureOptions) {
  const api = new ContactApiBrowserStorage();

  return Object.freeze({
    ContactMutation: createContactMutation(api, queryClient),
    ContactQuery: createContactQuery(api),
  });
}

export type ContactsFeature = ReturnType<typeof createContactsFeature>;
