import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { DateFormattingPreview } from "./DateFormattingPreview";

import { TimeFormattingPreview } from "./TimeFormattingPreview";

import { ExplicitTimeZonePreview } from "./ExplicitTimeZonePreview";

const dateCode = `const { formatDate } = useAppLocalizationFormatters()

formatDate(Date.UTC(2026, 8, 24, 14, 30))`;

const timeCode = `const { formatTime } = useAppLocalizationFormatters()

formatTime(Date.UTC(2026, 8, 24, 14, 30))`;

const dateTimeCode = `const { formatDateTime } = useAppLocalizationFormatters()

formatDateTime(Date.UTC(2026, 8, 24, 14, 30), {
  timeZone: 'America/New_York',
})`;

export function DatesAndTimesPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("localizationExamples.dates.contents.label"),
      title: t("localizationExamples.dates.contents.title"),
    },
    examples: [
      {
        code: dateCode,
        description: t("localizationExamples.dates.date.description"),
        id: "localization-date",
        sourcePath: "docs/storybook/patterns/Localization/components/DatesAndTimesPanel/DateFormattingPreview.tsx",
        preview: <DateFormattingPreview />,
        title: t("localizationExamples.dates.date.title"),
      },
      {
        code: timeCode,
        description: t("localizationExamples.dates.time.description"),
        id: "localization-time",
        sourcePath: "docs/storybook/patterns/Localization/components/DatesAndTimesPanel/TimeFormattingPreview.tsx",
        preview: <TimeFormattingPreview />,
        title: t("localizationExamples.dates.time.title"),
      },
      {
        code: dateTimeCode,
        description: t("localizationExamples.dates.dateTime.description"),
        id: "localization-explicit-time-zone",
        sourcePath: "docs/storybook/patterns/Localization/components/DatesAndTimesPanel/ExplicitTimeZonePreview.tsx",
        preview: <ExplicitTimeZonePreview />,
        title: t("localizationExamples.dates.dateTime.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
