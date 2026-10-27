const contactQueryKeyRoot = ["contacts"] as const;

/** This feature owns every cache key for Contacts persistence. */
export const ContactQueryKey = {
  all: contactQueryKeyRoot,
  collection: () => [...contactQueryKeyRoot, "collection"] as const,
} as const;
