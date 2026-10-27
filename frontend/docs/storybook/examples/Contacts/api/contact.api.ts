import type { Contact, ContactInput } from "../models/Contact";
import type { ContactStatus } from "../models/ContactStatus";

export type ContactRequestOptions = Readonly<{ signal?: AbortSignal }>;

/** A full editor save was based on an older copy of this contact. */
export class ContactConflictError extends Error {
  constructor(contactId: string) {
    super(`Contact ${contactId} changed since editing began.`);
    this.name = "ContactConflictError";
  }
}

/** Full updates must include the snapshot the editor originally opened. */
export type ContactUpdate = Readonly<{ contact: Contact; expected: Contact }>;

/** Status updates carry only the fields they intend to change. */
export type ContactStatusUpdate = Readonly<{ ids: readonly string[]; status: ContactStatus }>;

/** Persistence contract for the complete Contacts feature. */
export interface ContactApi {
  create(contact: ContactInput, options?: ContactRequestOptions): Promise<Contact>;
  findAll(options?: ContactRequestOptions): Promise<Contact[]>;
  remove(contactId: string, options?: ContactRequestOptions): Promise<void>;
  removeMany(contactIds: readonly string[], options?: ContactRequestOptions): Promise<void>;
  update(update: ContactUpdate, options?: ContactRequestOptions): Promise<Contact>;
  updateStatusMany(update: ContactStatusUpdate, options?: ContactRequestOptions): Promise<Contact[]>;
}
