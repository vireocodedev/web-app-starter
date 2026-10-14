import { RgoLocalStorageService } from "@rgo-web/frontend";
import { z } from "zod";

import { createDefaultContacts } from "./contact.defaults";
import { contactSchema, type Contact } from "../models/Contact";
import { contactStatusSchema } from "../models/ContactStatus";

export const contactStorageKey = "rgo.app.contacts";
/** Parsed pre-repair contact arrays are retained here for manual recovery. */
export const contactStorageRecoveryKey = `${contactStorageKey}.recovery`;

const storedContactStatusSchema = contactStatusSchema.or(
  z
    .enum(["active", "inactive"])
    .transform(status => (status === "active" ? ("ACTIVE" as const) : ("INACTIVE" as const))),
);
const storedContactSchema = z.object({
  email: z.string(),
  id: z.string().min(1),
  name: z.string(),
  organization: z.string(),
  role: z.string(),
  status: storedContactStatusSchema,
});

function createContactStorage() {
  // Record-level validation is performed below. An invalid legacy row must not
  // make the shared service reset the entire collection to demo defaults.
  const contactStorageSchema = z.object({
    [contactStorageKey]: z.array(z.unknown()),
    [contactStorageRecoveryKey]: z.array(z.array(z.unknown())),
  });

  const contactStorageDefaults = {
    [contactStorageKey]: createDefaultContacts(),
    [contactStorageRecoveryKey]: [],
  } satisfies z.output<typeof contactStorageSchema>;

  return new RgoLocalStorageService(contactStorageSchema, contactStorageDefaults);
}

/** Feature-owned, typed persistence for the removable Contacts example. */
export const contactStorage = /* @__PURE__ */ createContactStorage();

function archiveRejectedContacts(stored: unknown[]) {
  const snapshots = contactStorage.get(contactStorageRecoveryKey);
  const serialized = JSON.stringify(stored);
  if (snapshots.some(snapshot => JSON.stringify(snapshot) === serialized)) return;
  contactStorage.set(contactStorageRecoveryKey, [...snapshots, stored]);
}

/** Migrates valid legacy rows while preserving original parsed values for repair. */
export function readStoredContacts(): Contact[] {
  const stored = contactStorage.get(contactStorageKey);
  const valid: Contact[] = [];
  let rejected = false;
  for (const row of stored) {
    const legacy = storedContactSchema.safeParse(row);
    const parsed = legacy.success ? contactSchema.safeParse(legacy.data) : null;
    if (parsed?.success) valid.push(parsed.data);
    else rejected = true;
  }
  if (rejected) {
    // Archive the parsed original array first. If storage is unavailable or
    // full, leave the primary key untouched so no rejected row is lost.
    archiveRejectedContacts(stored);
    contactStorage.set(contactStorageKey, valid);
  }
  return valid;
}
