import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { DepartmentAssigneePreview } from "./DepartmentAssigneePreview";
import { ConditionalReasonPreview } from "./ConditionalReasonPreview";
import { DerivedSummaryPreview } from "./DerivedSummaryPreview";

const departmentCode = `<form.AppField
  name="department"
  listeners={{
    onChange: ({ value }) => {
      const remainsValid = (formExampleAssigneesByDepartment[value] ?? []).some(
        ({ id }) => id === form.state.values.assigneeId,
      )
      if (!remainsValid) form.setFieldValue('assigneeId', null)
    },
  }}
>
  {(field) => <field.SelectField options={departments} />}
</form.AppField>`;

const conditionalCode = `<form.AppField
  name="requestType"
  listeners={{
    onChange: ({ value }) => {
      if (value === 'standard') form.setFieldValue('exceptionReason', '')
    },
  }}
>
  {(field) => <field.SelectField options={requestTypes} />}
</form.AppField>

<form.Subscribe selector={({ values }) => values.requestType}>
  {(requestType) => requestType === 'exception' && <ExceptionReasonField />}
</form.Subscribe>

<form.SubmitButton>Validate request</form.SubmitButton>`;

const summaryCode = `<form.Subscribe selector={({ values }) => values}>
  {(values) => {
    const result = schema.safeParse(values)
    return result.success
      ? <AssignmentSummary value={result.data} />
      : <IncompleteSummary />
  }}
</form.Subscribe>`;

export function DependentFieldsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.dependent.contents.label"),
      title: t("formsExamples.dependent.contents.title"),
    },
    examples: [
      {
        code: departmentCode,
        description: t("formsExamples.dependent.department.description"),
        id: "forms-dependent-options",
        sourcePath: "docs/storybook/patterns/Forms/components/DependentFieldsPanel/DepartmentAssigneePreview.tsx",
        preview: <DepartmentAssigneePreview />,
        title: t("formsExamples.dependent.department.title"),
      },
      {
        code: conditionalCode,
        description: t("formsExamples.dependent.conditional.description"),
        id: "forms-conditional-fields",
        sourcePath: "docs/storybook/patterns/Forms/components/DependentFieldsPanel/ConditionalReasonPreview.tsx",
        preview: <ConditionalReasonPreview />,
        title: t("formsExamples.dependent.conditional.title"),
      },
      {
        code: summaryCode,
        description: t("formsExamples.dependent.summary.description"),
        id: "forms-derived-summary",
        sourcePath: "docs/storybook/patterns/Forms/components/DependentFieldsPanel/DerivedSummaryPreview.tsx",
        preview: <DerivedSummaryPreview />,
        title: t("formsExamples.dependent.summary.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
