import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { createLineItem } from "@/features/development-guide/patterns/forms/models/RepeatedFields";
import { createLineItemsFormSchema } from "@/features/development-guide/patterns/forms/validation/repeatedFields.validation";

const t = ((key: string) => key) as TFunction<"development-guide">;

describe("line item validation", () => {
  it("assigns localized validation errors to the nested row paths", () => {
    const result = createLineItemsFormSchema(t).safeParse({
      items: [
        createLineItem("first", "Valid"),
        {
          id: "second",
          description: " ",
          pricing: { quantity: 1.5, unitPrice: null },
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["items", 1, "description"],
            message: "formsExamples.repeated.errors.descriptionRequired",
          }),
          expect.objectContaining({
            path: ["items", 1, "pricing", "quantity"],
            message: "formsExamples.repeated.errors.quantityInvalid",
          }),
          expect.objectContaining({
            path: ["items", 1, "pricing", "unitPrice"],
            message: "formsExamples.repeated.errors.priceInvalid",
          }),
        ]),
      );
    }
  });

  it("requires at least one item and accepts a zero price", () => {
    const schema = createLineItemsFormSchema(t);
    const empty = schema.safeParse({ items: [] });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]).toMatchObject({
        path: ["items"],
        message: "formsExamples.repeated.errors.itemRequired",
      });
    }
    expect(
      schema.parse({
        items: [
          {
            ...createLineItem("one", " Item "),
            pricing: { quantity: 1, unitPrice: 0 },
          },
        ],
      }).items[0]?.description,
    ).toBe("Item");
  });
});
