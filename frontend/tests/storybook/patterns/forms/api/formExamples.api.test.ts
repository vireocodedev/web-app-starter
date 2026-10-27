import { describe, expect, it } from "vitest";

import {
  createFormExamplesApi,
  FormsServiceUnavailableError,
  FormsSlugConflictError,
} from "../../../../../docs/storybook/patterns/Forms/api/formExamples.api";

describe("createFormExamplesApi", () => {
  it("returns typed domain errors without changing the submitted value", async () => {
    const api = createFormExamplesApi(0);

    await expect(api.saveWorkspace({ slug: "existing", workspaceName: "Existing" })).rejects.toBeInstanceOf(
      FormsSlugConflictError,
    );
    await expect(api.saveWorkspace({ slug: "offline", workspaceName: "Offline" })).rejects.toBeInstanceOf(
      FormsServiceUnavailableError,
    );
  });

  it("returns the accepted workspace after a successful save", async () => {
    const api = createFormExamplesApi(0);

    await expect(api.saveWorkspace({ slug: "atlas", workspaceName: "Atlas" })).resolves.toEqual({
      id: "workspace-example",
      slug: "atlas",
      workspaceName: "Atlas",
    });
  });
});
