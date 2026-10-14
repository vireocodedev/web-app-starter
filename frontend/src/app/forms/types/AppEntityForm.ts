import type { RgoFormGroup } from "@rgo-web/frontend";
import type { TFunction } from "i18next";
import type { ZodType } from "zod";

/** State a parent needs to guard an editable form's lifecycle. */
export type AppFormState = Readonly<{ dirty: boolean; submitting: boolean }>;

/** Requires an existing entity only for update forms. */
export type AppEntityFormMode<Entity> =
  | Readonly<{ group: typeof RgoFormGroup.CREATE; initialValue?: never }>
  | Readonly<{ group: typeof RgoFormGroup.UPDATE; initialValue: Entity }>;

/** Shared callbacks and status for a create/update entity form. */
export type AppEntityFormProps<FormValue> = Readonly<{
  onSaved: () => void;
  onStateChange: (state: AppFormState) => void;
  onSubmit: (value: FormValue) => Promise<void>;
  saveFailed: boolean;
}> &
  AppEntityFormMode<FormValue>;

/** Builds localized validation for one entity form value and its operation context. */
export type AppEntitySchemaFactory<FormValue, Context extends object> = (
  t: TFunction<"translation">,
  context: Context,
) => ZodType<FormValue, FormValue>;
