export type ProfileFormValue = {
  confirmEmail: string;
  email: string;
  name: string;
};

export type WorkspaceFormValue = {
  slug: string;
  workspaceName: string;
};

export type DraftFormValue = {
  title: string;
};

export type AssignmentFormValue = {
  assigneeId: string | null;
  department: string;
  exceptionReason: string;
  requestType: "exception" | "standard";
};

export const formExampleAssigneesByDepartment = {
  engineering: [
    { id: "ana", label: "Ana" },
    { id: "luka", label: "Luka" },
  ],
  operations: [
    { id: "iva", label: "Iva" },
    { id: "marko", label: "Marko" },
  ],
} as const;

export const defaultProfileFormValue: ProfileFormValue = {
  confirmEmail: "",
  email: "",
  name: "",
};

export const defaultAssignmentFormValue: AssignmentFormValue = {
  assigneeId: null,
  department: "engineering",
  exceptionReason: "",
  requestType: "standard",
};
