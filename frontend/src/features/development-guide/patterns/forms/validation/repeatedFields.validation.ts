import type { TFunction } from "i18next";
import { z } from "zod";

export function createLineItemsFormSchema(t: TFunction<"development-guide">) {
  return z.object({
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          description: z.string().trim().min(1, t("formsExamples.repeated.errors.descriptionRequired")),
          pricing: z.object({
            quantity: z
              .number()
              .nullable()
              .refine(
                value => value !== null && Number.isInteger(value) && value > 0,
                t("formsExamples.repeated.errors.quantityInvalid"),
              )
              .pipe(z.number()),
            unitPrice: z
              .number()
              .nullable()
              .refine(
                value => value !== null && Number.isFinite(value) && value >= 0,
                t("formsExamples.repeated.errors.priceInvalid"),
              )
              .pipe(z.number()),
          }),
        }),
      )
      .min(1, t("formsExamples.repeated.errors.itemRequired")),
  });
}
