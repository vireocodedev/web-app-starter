import { Alert, Typography } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import {
  defaultAssignmentFormValue,
  formExampleAssigneesByDepartment,
  type AssignmentFormValue,
} from "../../models/FormExamples";
import { createAssignmentFormSchema } from "../../validation/forms.validation";

export function DerivedSummaryPreview() {
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
            <form.AppField name="assigneeId">
              {field => (
                <field.SelectField
                  fullWidth
                  getOptionValue={option => option.id}
                  label={t("formsExamples.dependent.fields.assignee")}
                  options={formExampleAssigneesByDepartment.engineering}
                  renderOption={option => option.label}
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.Subscribe selector={state => state.values}>
              {values => {
                const result = schema.safeParse(values);
                return (
                  <Alert severity={result.success ? "success" : "warning"}>
                    {t(
                      result.success
                        ? "formsExamples.dependent.summary.ready"
                        : "formsExamples.dependent.summary.incomplete",
                    )}
                  </Alert>
                );
              }}
            </form.Subscribe>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.SubmitButton variant="contained">{t("formsExamples.dependent.summary.submit")}</form.SubmitButton>
          </RgoContainerGrid>
          {submitted ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Typography color="success.main" variant="body2">
                {t("formsExamples.dependent.summary.submitted")}
              </Typography>
            </RgoContainerGrid>
          ) : null}
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
