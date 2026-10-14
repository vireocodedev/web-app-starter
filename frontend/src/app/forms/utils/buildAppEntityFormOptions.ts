import { revalidateLogic } from "@tanstack/react-form";
import type { ZodType } from "zod";

import type { AppEntityFormProps } from "../types/AppEntityForm";

/** Supplies validation and submission behavior shared by entity forms. */
export function buildAppEntityFormOptions<FormValue>(
  validationSchema: ZodType<FormValue, FormValue>,
  props: AppEntityFormProps<FormValue>,
) {
  return {
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value }: { value: FormValue }) => {
      props.onStateChange({ dirty: true, submitting: true });
      const parsedValue = validationSchema.parse(value);
      await props.onSubmit(parsedValue);
      props.onSaved();
    },
  };
}
