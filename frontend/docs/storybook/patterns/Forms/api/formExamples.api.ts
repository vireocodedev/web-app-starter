import type { WorkspaceFormValue } from "../models/FormExamples";

export class FormsSlugConflictError extends Error {
  readonly code = "slug-conflict";
}

export class FormsServiceUnavailableError extends Error {
  readonly code = "service-unavailable";
}

export type SavedWorkspace = WorkspaceFormValue & Readonly<{ id: string }>;

export type FormExamplesApi = Readonly<{
  saveWorkspace: (value: WorkspaceFormValue) => Promise<SavedWorkspace>;
}>;

export function createFormExamplesApi(delayMs = 650): FormExamplesApi {
  return {
    async saveWorkspace(value) {
      await new Promise(resolve => globalThis.setTimeout(resolve, delayMs));
      if (value.slug === "existing") throw new FormsSlugConflictError();
      if (value.slug === "offline") throw new FormsServiceUnavailableError();
      return { ...value, id: "workspace-example" };
    },
  };
}
