import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { LocalizedSchemaPreview } from "./LocalizedSchemaPreview";
import { ValidationTimingPreview } from "./ValidationTimingPreview";
import { CrossFieldValidationPreview } from "./CrossFieldValidationPreview";

const localizedSchemaCode = `import type { TFunction } from 'i18next'
import { z } from 'zod'

const createProfileSchema = (t: TFunction<'development-guide'>) => z.object({
  name: z.string().trim().min(1, t('profile.nameRequired')),
  email: z.string().trim().email(t('profile.emailInvalid')),
})

const schema = createProfileSchema(t)`;

const validationTimingCode = `import { revalidateLogic } from '@tanstack/react-form'

const schema = createProfileSchema(t)
const form = useRgoForm({
  defaultValues,
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: { onDynamic: schema },
  onSubmit: ({ value }) => save(schema.parse(value)),
})`;

const crossFieldCode = `import type { TFunction } from 'i18next'
import { z } from 'zod'

const createProfileSchema = (t: TFunction<'development-guide'>) =>
  z.object({
    email: z.string().email(t('profile.emailInvalid')),
    confirmEmail: z.string().trim(),
  }).refine(({ email, confirmEmail }) => email === confirmEmail, {
    message: t('profile.emailMismatch'),
    path: ['confirmEmail'],
  })`;

export function ValidationAndErrorPresentationPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.validation.contents.label"),
      title: t("formsExamples.validation.contents.title"),
    },
    examples: [
      {
        code: localizedSchemaCode,
        description: t("formsExamples.validation.localized.description"),
        id: "forms-localized-schema",
        sourcePath:
          "docs/storybook/patterns/Forms/components/ValidationAndErrorPresentationPanel/LocalizedSchemaPreview.tsx",
        preview: <LocalizedSchemaPreview />,
        title: t("formsExamples.validation.localized.title"),
      },
      {
        code: validationTimingCode,
        description: t("formsExamples.validation.timing.description"),
        id: "forms-validation-timing",
        sourcePath:
          "docs/storybook/patterns/Forms/components/ValidationAndErrorPresentationPanel/ValidationTimingPreview.tsx",
        preview: <ValidationTimingPreview />,
        title: t("formsExamples.validation.timing.title"),
      },
      {
        code: crossFieldCode,
        description: t("formsExamples.validation.crossField.description"),
        id: "forms-cross-field-validation",
        sourcePath:
          "docs/storybook/patterns/Forms/components/ValidationAndErrorPresentationPanel/CrossFieldValidationPreview.tsx",
        preview: <CrossFieldValidationPreview />,
        title: t("formsExamples.validation.crossField.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
