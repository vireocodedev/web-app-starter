import { Alert } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { defaultProfileFormValue } from "../../models/FormExamples";
import { createProfileFormSchema } from "../../validation/forms.validation";

export function LocalizedSchemaPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [submitted, setSubmitted] = useState(false);
  const schema = createProfileFormSchema(t);
  const form = useRgoForm({
    defaultValues: defaultProfileFormValue,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      schema.parse(value);
      setSubmitted(true);
    },
  });

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <RgoContainerGrid columns={{ sm: 2, xs: 1 }} container spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.AppField listeners={{ onChange: () => setSubmitted(false) }} name="name">
              {field => <field.TextField fullWidth label={t("formsExamples.validation.fields.name")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField listeners={{ onChange: () => setSubmitted(false) }} name="email">
              {field => (
                <field.TextField fullWidth label={t("formsExamples.validation.fields.email")} required type="email" />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField listeners={{ onChange: () => setSubmitted(false) }} name="confirmEmail">
              {field => (
                <field.TextField
                  fullWidth
                  label={t("formsExamples.validation.fields.confirmEmail")}
                  required
                  type="email"
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.SubmitButton variant="contained">{t("formsExamples.validation.submit")}</form.SubmitButton>
          </RgoContainerGrid>
          {submitted ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Alert severity="success">{t("formsExamples.validation.success")}</Alert>
            </RgoContainerGrid>
          ) : null}
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
