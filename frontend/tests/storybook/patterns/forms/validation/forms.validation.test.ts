import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  createAssignmentFormSchema,
  createProfileFormSchema,
} from "../../../../../docs/storybook/patterns/Forms/validation/forms.validation";

const t = ((key: string) => key) as TFunction<"development-guide">;

describe("forms example validation", () => {
  it("places the localized email mismatch on confirmation", () => {
    const result = createProfileFormSchema(t).safeParse({
      confirmEmail: "different@example.test",
      email: "person@example.test",
      name: "Person",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: "formsExamples.validation.errors.emailMismatch",
          path: ["confirmEmail"],
        }),
      );
    }
  });

  it("rejects an assignee outside the selected department", () => {
    const result = createAssignmentFormSchema(t).safeParse({
      assigneeId: "iva",
      department: "engineering",
      exceptionReason: "",
      requestType: "standard",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: "formsExamples.dependent.errors.assigneeInvalid",
          path: ["assigneeId"],
        }),
      );
    }
  });

  it("requires a reason only for exception requests", () => {
    const schema = createAssignmentFormSchema(t);
    const common = {
      assigneeId: "ana",
      department: "engineering",
      exceptionReason: "",
    };

    expect(schema.safeParse({ ...common, requestType: "standard" }).success).toBe(true);
    expect(schema.safeParse({ ...common, requestType: "exception" }).success).toBe(false);
  });
});
