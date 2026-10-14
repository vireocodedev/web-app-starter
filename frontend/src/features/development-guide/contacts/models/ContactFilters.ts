import type { Contact } from "./Contact";
import type { ContactStatus } from "./ContactStatus";

export type ContactStatusFilter = "all" | ContactStatus;

export type ContactFilters = Readonly<{
  query: string;
  status: ContactStatusFilter;
}>;

export function buildDefaultContactFilters(): ContactFilters {
  return { query: "", status: "all" };
}

export function filterContacts(contacts: readonly Contact[], filters: ContactFilters): Contact[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return contacts.filter(contact => {
    const matchesStatus = filters.status === "all" || contact.status === filters.status;
    const matchesQuery =
      query.length === 0 ||
      [contact.name, contact.email, contact.organization, contact.role].some(value =>
        value.toLocaleLowerCase().includes(query),
      );
    return matchesStatus && matchesQuery;
  });
}

export function activeFilterCount(filters: ContactFilters): number {
  return Number(filters.query.trim().length > 0) + Number(filters.status !== "all");
}
