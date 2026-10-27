import { z } from "zod";

/** Consumer recipe: these messages, DTOs and helpers are not installed app APIs. */
export const draftExampleMessages = {
  formLabel: "Draft request",
  title: "Request title",
  category: "Category",
  equipment: "Equipment",
  software: "Software",
  quantity: "Quantity",
  softwarePurpose: "Software purpose",
  submit: "Submit request",
  save: "Save draft",
  saving: "Saving…",
  required: "This field is required.",
  titleLong: "Use at most 120 characters.",
  purposeLong: "Use at most 500 characters.",
  purposeShort: "Explain the purpose in at least 10 characters.",
  quantityRange: "Enter a whole quantity within the allowed range.",
  notAvailable: "This value is no longer available. Choose another value.",
  invalid: "Correct the marked fields. No command was sent.",
  rejected: "The write was rejected. Your input is unchanged; retry when ready.",
  uncertain:
    "The write outcome is unknown. Further writes and editor exits are blocked. Reconcile the authoritative record before continuing.",
  outcomeUnknown: "Outcome unknown",
  logoutFailed: "The sign-out action did not complete. Follow the authentication owner's recovery policy.",
  serverInvalid: "The server rejected these values. Correct the marked fields.",
  conflict:
    "The saved version changed. Your input and original version are preserved. Review fresh data before retrying.",
  saved: "Draft accepted. The returned values are now the clean baseline.",
  submitted: "Request submitted after complete validation.",
  idle: "Save an incomplete draft, or complete the fields and submit.",
  discardTitle: "Discard unsaved changes?",
  discardMessage: "Leave this editor and discard changes since the last accepted save?",
  discard: "Discard changes",
  keep: "Keep editing",
  busyLeave: "Stay here while the command is pending. Leaving would not undo a server write.",
  draftHelp: "An incomplete draft is allowed. Submit requires a title and the active category details.",
  categoryHelp: "Changing category clears its previous details. Hidden details are also pruned from the command.",
  dirty: "Dirty",
  clean: "Clean",
  acceptedVersion: "Accepted version",
  latestVersion: "Latest observed version",
  stale: "Background data changed. The draft and its accepted version stay pinned together.",
  logout: "Preview logout",
} as const;

export type DraftMessage = keyof typeof draftExampleMessages;
export type DraftTranslate = (key: DraftMessage) => string;
export type DraftIntent = "draft" | "submit";
export type DraftValues = {
  title: string;
  category: "equipment" | "software";
  quantity: number | null;
  softwarePurpose: string;
};
export type DraftValidationContext = Readonly<{ intent: DraftIntent; maximumEquipmentQuantity: number }>;

export function pruneDraftValues(value: DraftValues): DraftValues {
  return value.category === "equipment" ? { ...value, softwarePurpose: "" } : { ...value, quantity: null };
}

export function createDraftRequestSchema(t: DraftTranslate, context: DraftValidationContext) {
  return z
    .object({
      title: z.string().trim().max(120, t("titleLong")),
      category: z.enum(["equipment", "software"]),
      quantity: z.number({ error: t("quantityRange") }).nullable(),
      softwarePurpose: z.string().trim().max(500, t("purposeLong")),
    })
    .superRefine((value, issue) => {
      if (context.intent === "submit" && !value.title) {
        issue.addIssue({ code: "custom", path: ["title"], message: t("required") });
      }
      if (value.category === "equipment") {
        if (value.quantity === null) {
          if (context.intent === "submit") {
            issue.addIssue({ code: "custom", path: ["quantity"], message: t("required") });
          }
        } else if (
          !Number.isInteger(value.quantity) ||
          value.quantity < 1 ||
          value.quantity > context.maximumEquipmentQuantity
        ) {
          issue.addIssue({ code: "custom", path: ["quantity"], message: t("quantityRange") });
        }
      } else if (context.intent === "submit" && value.softwarePurpose.length < 10) {
        issue.addIssue({ code: "custom", path: ["softwarePurpose"], message: t("purposeShort") });
      }
    })
    .transform(pruneDraftValues);
}

export type DraftCommand = Readonly<{ intent: DraftIntent; expectedVersion: number; values: DraftValues }>;
export type AcceptedDraft = Readonly<{ version: number; status: "DRAFT" | "SUBMITTED"; values: DraftValues }>;

export class DraftCommandError extends Error {
  readonly kind: "validation" | "conflict" | "rejected" | "uncertain";
  readonly fieldErrors: unknown;

  constructor(kind: DraftCommandError["kind"], fieldErrors: unknown = []) {
    super(kind);
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}

/** Translate only known codes on active, explicitly allowed fields. Never render server prose. */
export function mapDraftServerErrors(raw: unknown, values: DraftValues, t: DraftTranslate) {
  const fields: Partial<Record<keyof DraftValues, string>> = {};
  const parsed = z
    .array(z.object({ field: z.string().max(80), code: z.string().max(80) }))
    .max(20)
    .safeParse(raw);
  if (!parsed.success) return fields;
  for (const { field, code } of parsed.data) {
    if (field !== "title" && field !== "quantity" && field !== "softwarePurpose") continue;
    if (field === "quantity" && values.category !== "equipment") continue;
    if (field === "softwarePurpose" && values.category !== "software") continue;
    if (code === "required") fields[field] = t("required");
    else if (code === "outOfRange") fields[field] = t("quantityRange");
    else if (code === "notAvailable") fields[field] = t("notAvailable");
  }
  return fields;
}
