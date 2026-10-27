import { ContactConflictError, type ContactApi } from "./contact.api";
import { createDefaultContacts } from "./contact.defaults";
import { contactSchema, type Contact } from "../models/Contact";

/** A fresh, private collection per Storybook preview. No application storage. */
export function createMemoryContactApi(): ContactApi {
  let contacts = createDefaultContacts();
  const clone = (value: Contact) => ({ ...value });
  return {
    async findAll(options) {
      options?.signal?.throwIfAborted();
      return contacts.map(clone);
    },
    async create(input, options) {
      options?.signal?.throwIfAborted();
      const contact = contactSchema.parse({ ...input, id: crypto.randomUUID() });
      contacts = [...contacts, contact];
      return clone(contact);
    },
    async update({ contact, expected }, options) {
      options?.signal?.throwIfAborted();
      const current = contacts.find(item => item.id === contact.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(expected)) throw new ContactConflictError(contact.id);
      const parsed = contactSchema.parse(contact);
      contacts = contacts.map(item => (item.id === parsed.id ? parsed : item));
      return clone(parsed);
    },
    async remove(id, options) {
      options?.signal?.throwIfAborted();
      contacts = contacts.filter(item => item.id !== id);
    },
    async removeMany(ids, options) {
      options?.signal?.throwIfAborted();
      contacts = contacts.filter(item => !ids.includes(item.id));
    },
    async updateStatusMany({ ids, status }, options) {
      options?.signal?.throwIfAborted();
      contacts = contacts.map(item => (ids.includes(item.id) ? { ...item, status } : item));
      return contacts.filter(item => ids.includes(item.id)).map(clone);
    },
  };
}
