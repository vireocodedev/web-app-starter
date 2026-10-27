import type { TFunction } from "i18next";
import { z } from "zod";

import { contactStatusSchema } from "./ContactStatus";

const contactNameMaxLength = 100;
const contactTextMaxLength = 120;

type LocalizedContactFieldMessages = Readonly<{
  required: string;
  invalid?: string;
  max?: string;
}>;

/** Keep every field rule on the entity schema; customize only its error text. */
function localizeContactField(schema: z.ZodString, messages: LocalizedContactFieldMessages) {
  return schema.clone({
    ...schema.def,
    error: (issue: z.core.$ZodRawIssue) => {
      if (issue.code === "too_small") return messages.required;
      if (issue.code === "too_big") return messages.max;
      if (issue.code === "invalid_format") return messages.invalid;
      return undefined;
    },
  });
}

/** A contact persisted by the application-owned browser adapter. */
export const contactSchema = z.object({
  email: z.string().trim().min(1).email(),
  id: z.string().min(1),
  name: z.string().trim().min(1).max(contactNameMaxLength),
  organization: z.string().trim().min(1).max(contactTextMaxLength),
  role: z.string().trim().min(1).max(contactTextMaxLength),
  status: contactStatusSchema,
});

export type Contact = z.output<typeof contactSchema>;
export type ContactInput = Omit<Contact, "id">;
export type ContactFormValue = ContactInput & Readonly<{ id?: string }>;

export function buildDefaultContactInput(): ContactInput {
  return {
    email: "",
    name: "",
    organization: "",
    role: "",
    status: "ACTIVE",
  };
}

/** Localized form validation is derived from, but does not replace, the persisted contact schema. */
export const createContactValidationSchema: (
  t: TFunction<"development-guide">,
  context: { requiresId: boolean },
) => z.ZodType<ContactFormValue, ContactFormValue> = (t, { requiresId }) =>
  contactSchema.extend({
    email: localizeContactField(contactSchema.shape.email, {
      required: t("contacts.validation.emailRequired"),
      invalid: t("contacts.validation.emailInvalid"),
    }),
    name: localizeContactField(contactSchema.shape.name, {
      required: t("contacts.validation.nameRequired"),
      max: t("contacts.validation.nameMax", { max: contactNameMaxLength }),
    }),
    organization: localizeContactField(contactSchema.shape.organization, {
      required: t("contacts.validation.organizationRequired"),
      max: t("contacts.validation.organizationMax", { max: contactTextMaxLength }),
    }),
    role: localizeContactField(contactSchema.shape.role, {
      required: t("contacts.validation.roleRequired"),
      max: t("contacts.validation.roleMax", { max: contactTextMaxLength }),
    }),
    id: requiresId ? contactSchema.shape.id : contactSchema.shape.id.optional(),
  });
