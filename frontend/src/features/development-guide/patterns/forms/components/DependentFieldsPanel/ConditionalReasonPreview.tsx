import { Alert } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { defaultAssignmentFormValue, type AssignmentFormValue } from "../../models/FormExamples";
import { createAssignmentFormSchema } from "../../validation/forms.validation";

const requestTypeOptions = [
  { id: "standard", labelKey: "standard" },
  { id: "exception", labelKey: "exception" },
] as const;

export function ConditionalReasonPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const schema = createAssignmentFormSchema(t);
  const [submitted, setSubmitted] = useState(false);
  const defaultValues: AssignmentFormValue = {
    ...defaultAssignmentFormValue,
    assigneeId: "ana",
  };
  const form = useRgoForm({
    defaultValues,
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
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField
              listeners={{
                onChange: ({ value }) => {
                  setSubmitted(false);
                  if (value === "standard") {
                    form.setFieldValue("exceptionReason", "");
                  }
                },
              }}
              name="requestType"
            >
              {field => (
                <field.SelectField
                  fullWidth
                  getOptionValue={option => option.id}
                  label={t("formsExamples.dependent.fields.requestType")}
                  options={requestTypeOptions.map(option => ({
                    id: option.id,
                    label: t(`formsExamples.dependent.requestTypes.${option.labelKey}`),
                  }))}
                  renderOption={option => option.label}
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.Subscribe selector={state => state.values.requestType}>
              {requestType =>
                requestType === "exception" ? (
                  <form.AppField listeners={{ onChange: () => setSubmitted(false) }} name="exceptionReason">
                    {field => <field.TextField fullWidth label={t("formsExamples.dependent.fields.reason")} required />}
                  </form.AppField>
                ) : (
                  <Alert severity="info">{t("formsExamples.dependent.conditional.standardHint")}</Alert>
                )
              }
            </form.Subscribe>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.SubmitButton variant="contained">{t("formsExamples.dependent.conditional.submit")}</form.SubmitButton>
          </RgoContainerGrid>
          {submitted ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Alert severity="success">{t("formsExamples.dependent.conditional.valid")}</Alert>
            </RgoContainerGrid>
          ) : null}
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
