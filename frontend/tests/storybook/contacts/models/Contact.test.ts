import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  buildDefaultContactInput,
  createContactValidationSchema,
} from "../../../../docs/storybook/examples/Contacts/models/Contact";

const t = ((key: string, values?: { max?: number }) =>
  `localized:${key}${values?.max === undefined ? "" : `:${values.max}`}`) as TFunction<"development-guide">;

const input = {
  ...buildDefaultContactInput(),
  email: " alex@example.com ",
  name: " Alex Morgan ",
  organization: " Example Studio ",
  role: " Designer ",
};

describe("localized contact schema factory", () => {
  it("changes identity requirements through external operation context", () => {
    const create = createContactValidationSchema(t, { requiresId: false });
    const update = createContactValidationSchema(t, { requiresId: true });

    expect(create.safeParse(input).success).toBe(true);
    const missingIdentity = update.safeParse(input);
    expect(missingIdentity.success).toBe(false);
    if (!missingIdentity.success) {
      expect(missingIdentity.error.issues).toContainEqual(expect.objectContaining({ path: ["id"] }));
    }
    expect(update.parse({ ...input, id: "existing-contact" }).id).toBe("existing-contact");
  });

  it("uses the supplied translator for field errors and interpolated limits", () => {
    const schema = createContactValidationSchema(t, { requiresId: false });
    const result = schema.safeParse({ ...input, name: "x".repeat(101), email: "invalid", role: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["name"], message: "localized:contacts.validation.nameMax:100" }),
          expect.objectContaining({ path: ["email"], message: "localized:contacts.validation.emailInvalid" }),
          expect.objectContaining({ path: ["role"], message: "localized:contacts.validation.roleRequired" }),
        ]),
      );
    }
  });

  it("returns normalized values and retains the persisted status choice", () => {
    const schema = createContactValidationSchema(t, { requiresId: false });

    expect(schema.parse({ ...input, status: "INACTIVE" })).toEqual({
      email: "alex@example.com",
      name: "Alex Morgan",
      organization: "Example Studio",
      role: "Designer",
      status: "INACTIVE",
    });
  });
});
