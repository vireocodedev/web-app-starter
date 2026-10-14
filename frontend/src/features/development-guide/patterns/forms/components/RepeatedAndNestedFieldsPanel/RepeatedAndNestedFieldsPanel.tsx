import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { LineItemsPreview } from "./LineItemsPreview";

const lineItemsCode = `<form.AppField name="items" mode="array">
  {(itemsField) => (
    <Stack spacing={2}>
      {itemsField.state.value.map((item, index) => (
        <Box key={item.id}>
          <form.AppField name={\`items[\${index}].description\`}>
            {(field) => <field.TextField label={t('formsExamples.repeated.fields.description')} />}
          </form.AppField>
          <Button onClick={() => void itemsField.removeValue(index)}>
            {t('formsExamples.repeated.remove')}
          </Button>
        </Box>
      ))}
      <Button onClick={() => itemsField.pushValue(createLineItem(\`line-\${nextId.current++}\`))}>
        {t('formsExamples.repeated.add')}
      </Button>
    </Stack>
  )}
</form.AppField>

// Validate the complete nested payload, then establish the accepted baseline.
onSubmit: ({ value, formApi }) => {
  const result = schema.parse(value)
  setDefaultValues(result)
  setAccepted(result)
  formApi.reset(result)
}`;

export function RepeatedAndNestedFieldsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.repeated.contents.label"),
      title: t("formsExamples.repeated.contents.title"),
    },
    examples: [
      {
        code: lineItemsCode,
        description: t("formsExamples.repeated.lineItems.description"),
        id: "forms-repeated-line-items",
        sourcePath:
          "src/features/development-guide/patterns/forms/components/RepeatedAndNestedFieldsPanel/LineItemsPreview.tsx",
        preview: <LineItemsPreview />,
        title: t("formsExamples.repeated.lineItems.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
