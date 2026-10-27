import type { Contact } from "./Contact";

/** The content shown in the Contacts workspace overlay. */
export type ContactWorkspaceView =
  | Readonly<{ mode: "create" }>
  | Readonly<{ mode: "edit"; contact: Contact }>
  | Readonly<{ mode: "details"; contactId: string }>
  | Readonly<{ mode: "filters" }>;
