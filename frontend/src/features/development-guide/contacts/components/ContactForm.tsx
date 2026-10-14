import { Alert } from "@mui/material";
import { RgoContainerGrid, RgoFormGroup, useRgoForm } from "@rgo-web/frontend";

import { useFormStateReporter } from "@/app/forms/hooks/useFormStateReporter";
import type { AppEntityFormProps } from "@/app/forms/types/AppEntityForm";
import { buildAppEntityFormOptions } from "@/app/forms/utils/buildAppEntityFormOptions";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { buildDefaultContactInput, createContactValidationSchema, type ContactFormValue } from "../models/Contact";
import { contactStatusSchema } from "../models/ContactStatus";

type ContactFormProps = AppEntityFormProps<ContactFormValue>;

/** Shared create/update form used by the page-local Contacts overlays. */
export function ContactForm(props: ContactFormProps) {
  const { t } = useDevelopmentGuideTranslation();
  const isCreating = props.group === RgoFormGroup.CREATE;
  const validationSchema = createContactValidationSchema(t, { requiresId: !isCreating });
  const formDefaultValue: ContactFormValue =
    props.group === RgoFormGroup.CREATE ? buildDefaultContactInput() : props.initialValue;
  const form = useRgoForm({
    defaultValues: formDefaultValue,
    ...buildAppEntityFormOptions(validationSchema, props),
  });
  useFormStateReporter(form.store, props.onStateChange);

  return (
    <form.AppForm>
      <form.Form>
        <RgoContainerGrid columns={{ sm: 2, xs: 1 }} container spacing={2}>
          {props.saveFailed ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Alert severity="error">{t("contacts.save.failed")}</Alert>
            </RgoContainerGrid>
          ) : null}
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="name">
              {field => <field.TextField autoFocus fullWidth label={t("contacts.fields.name")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="email">
              {field => <field.TextField fullWidth label={t("contacts.fields.email")} required type="email" />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="organization">
              {field => <field.TextField fullWidth label={t("contacts.fields.organization")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="role">
              {field => <field.TextField fullWidth label={t("contacts.fields.role")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.AppField name="status">
              {field => (
                <field.SelectField
                  fullWidth
                  getOptionValue={option => option}
                  label={t("contacts.fields.status")}
                  options={contactStatusSchema.options}
                  renderOption={option => t(`contacts.status.${option}`)}
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <form.SubmitButton variant="contained">
              {t(isCreating ? "contacts.form.createAction" : "contacts.form.updateAction")}
            </form.SubmitButton>
          </RgoContainerGrid>
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
