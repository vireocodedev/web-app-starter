import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { DocumentationNavigationTree } from "@/app/shell/documentation";

import type { AppExampleNavigationGroup } from "../types/ExampleNavigation";

export function ExamplesNavigation({ groups }: Readonly<{ groups: readonly AppExampleNavigationGroup[] }>) {
  const { t } = useDevelopmentGuideTranslation();
  return <DocumentationNavigationTree groups={groups} navigationLabel={t("navigation.examples")} />;
}
