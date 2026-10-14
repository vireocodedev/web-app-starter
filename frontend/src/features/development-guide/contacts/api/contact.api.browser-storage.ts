import {
  ContactConflictError,
  type ContactApi,
  type ContactRequestOptions,
  type ContactStatusUpdate,
  type ContactUpdate,
} from "./contact.api";
import { contactStorage, contactStorageKey, readStoredContacts } from "./contact.storage";
import { contactSchema, type Contact, type ContactInput } from "../models/Contact";
import { contactStatusSchema } from "../models/ContactStatus";

type ContactIdFactory = () => string;

function defaultContactIdFactory() {
  return globalThis.crypto.randomUUID();
}

function checkAborted(options?: ContactRequestOptions) {
  options?.signal?.throwIfAborted();
}

function sameContact(left: Contact, right: Contact) {
  return (
    left.id === right.id &&
    left.email === right.email &&
    left.name === right.name &&
    left.organization === right.organization &&
    left.role === right.role &&
    left.status === right.status
  );
}

/** Browser-only persistence adapter; the feature contract remains async. */
export class ContactApiBrowserStorage implements ContactApi {
  private readonly createId: ContactIdFactory;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(createId: ContactIdFactory = defaultContactIdFactory) {
    this.createId = createId;
  }

  private enqueueMutation<Result>(
    options: ContactRequestOptions | undefined,
    mutate: (contacts: Contact[]) => Readonly<{ contacts: Contact[]; result: Result }>,
  ): Promise<Result> {
    const operation = this.mutationQueue.then(() => {
      checkAborted(options);
      const contacts = readStoredContacts();
      const mutation = mutate(contacts);
      checkAborted(options);
      contactStorage.set(contactStorageKey, mutation.contacts);
      return mutation.result;
    });
    this.mutationQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async findAll(options?: ContactRequestOptions) {
    checkAborted(options);
    const contacts = readStoredContacts();
    checkAborted(options);
    return contacts.map(contact => ({ ...contact }));
  }

  async create(contact: ContactInput, options?: ContactRequestOptions) {
    return this.enqueueMutation(options, contacts => {
      const savedContact = contactSchema.parse({
        ...contact,
        id: this.createId(),
      });
      return {
        contacts: [...contacts, savedContact],
        result: { ...savedContact },
      };
    });
  }

  async update({ contact, expected }: ContactUpdate, options?: ContactRequestOptions) {
    const savedContact = contactSchema.parse(contact);
    const baseline = contactSchema.parse(expected);
    if (savedContact.id !== baseline.id) {
      throw new Error("Contact update and baseline must refer to the same contact.");
    }
    return this.enqueueMutation(options, contacts => {
      const contactIndex = contacts.findIndex(({ id }) => id === savedContact.id);
      if (contactIndex === -1) {
        throw new Error(`Contact ${savedContact.id} does not exist.`);
      }
      if (!sameContact(contacts[contactIndex]!, baseline)) {
        throw new ContactConflictError(savedContact.id);
      }
      const nextContacts = [...contacts];
      nextContacts[contactIndex] = savedContact;
      return { contacts: nextContacts, result: { ...savedContact } };
    });
  }

  async updateStatusMany({ ids, status }: ContactStatusUpdate, options?: ContactRequestOptions) {
    const requestedStatus = contactStatusSchema.parse(status);
    const uniqueIds = new Set(ids);
    return this.enqueueMutation(options, contacts => {
      const knownIds = new Set(contacts.map(({ id }) => id));
      const missingId = ids.find(id => !knownIds.has(id));
      if (missingId) {
        throw new Error(`Contact ${missingId} does not exist.`);
      }
      const updated: Contact[] = [];
      const nextContacts = contacts.map(contact => {
        if (!uniqueIds.has(contact.id)) return contact;
        const nextContact = { ...contact, status: requestedStatus };
        updated.push(nextContact);
        return nextContact;
      });
      return { contacts: nextContacts, result: updated.map(contact => ({ ...contact })) };
    });
  }

  async remove(contactId: string, options?: ContactRequestOptions) {
    return this.enqueueMutation(options, contacts => {
      const remainingContacts = contacts.filter(({ id }) => id !== contactId);
      if (remainingContacts.length === contacts.length) {
        throw new Error(`Contact ${contactId} does not exist.`);
      }
      return { contacts: remainingContacts, result: undefined };
    });
  }

  async removeMany(contactIds: readonly string[], options?: ContactRequestOptions) {
    const ids = new Set(contactIds);
    return this.enqueueMutation(options, contacts => {
      const knownIds = new Set(contacts.map(({ id }) => id));
      const missingId = contactIds.find(id => !knownIds.has(id));
      if (missingId) {
        throw new Error(`Contact ${missingId} does not exist.`);
      }
      return {
        contacts: contacts.filter(({ id }) => !ids.has(id)),
        result: undefined,
      };
    });
  }
}
