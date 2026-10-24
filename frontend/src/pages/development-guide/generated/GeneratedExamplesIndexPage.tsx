import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppCategoryList } from "@/app/shell/components/AppCategoryList";

export type GeneratedExampleEntry = Readonly<{
  id: string;
  kind: "component" | "form" | "shell" | "table" | "page" | "feature";
  label: string;
  to: string;
}>;

/** The router supplies destinations; this adapter only presents the existing guide navigation. */
export function GeneratedExamplesIndexPage({ entries }: Readonly<{ entries: readonly GeneratedExampleEntry[] }>) {
  const { t } = useDevelopmentGuideTranslation();
  const kinds = ["component", "form", "shell", "table", "page", "feature"] as const;
  return (
    <AppCategoryList
      title={t("generatedExamples.title")}
      description={t("generatedExamples.description")}
      navigationLabel={t("generatedExamples.title")}
      items={kinds.flatMap(kind => {
        const examples = entries.filter(entry => entry.kind === kind);
        return examples.length
          ? [
              {
                id: kind,
                label: t(`generatedExamples.kinds.${kind}`),
                items: examples.map(entry => ({ ...entry, Icon: WidgetsOutlinedIcon })),
              },
            ]
          : [];
      })}
    />
  );
}
