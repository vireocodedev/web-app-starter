import { Alert } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { defaultAssignmentFormValue, formExampleAssigneesByDepartment } from "../../models/FormExamples";
import { createAssignmentFormSchema } from "../../validation/forms.validation";

const departmentOptions = [
  { id: "engineering", labelKey: "engineering" },
  { id: "operations", labelKey: "operations" },
] as const;

type AssigneeOption = Readonly<{ id: string; label: string }>;

function assigneesForDepartment(department: string): readonly AssigneeOption[] {
  return formExampleAssigneesByDepartment[department as keyof typeof formExampleAssigneesByDepartment] ?? [];
}

export function DepartmentAssigneePreview() {
  const { t } = useDevelopmentGuideTranslation();
  const schema = createAssignmentFormSchema(t);
  const form = useRgoForm({
    defaultValues: defaultAssignmentFormValue,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => schema.parse(value),
  });

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <RgoContainerGrid columns={{ sm: 2, xs: 1 }} container spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField
              listeners={{
                onChange: ({ value }) => {
                  const options = assigneesForDepartment(value);
                  if (!options.some(({ id }) => id === form.state.values.assigneeId)) {
                    form.setFieldValue("assigneeId", null);
                  }
                },
              }}
              name="department"
            >
              {field => (
                <field.SelectField
                  fullWidth
                  getOptionValue={option => option.id}
                  label={t("formsExamples.dependent.fields.department")}
                  options={departmentOptions.map(option => ({
                    id: option.id,
                    label: t(`formsExamples.dependent.departments.${option.labelKey}`),
                  }))}
                  renderOption={option => option.label}
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.Subscribe selector={state => state.values.department}>
              {department => (
                <form.AppField name="assigneeId">
                  {field => (
                    <field.SelectField
                      fullWidth
                      getOptionValue={option => option.id}
                      label={t("formsExamples.dependent.fields.assignee")}
                      disabled={assigneesForDepartment(department).length === 0}
                      options={assigneesForDepartment(department)}
                      placeholder={t("formsExamples.dependent.fields.chooseAssignee")}
                      renderOption={option => option.label}
                    />
                  )}
                </form.AppField>
              )}
            </form.Subscribe>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <Alert severity="info">{t("formsExamples.dependent.department.hint")}</Alert>
          </RgoContainerGrid>
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
