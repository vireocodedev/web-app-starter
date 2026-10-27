import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { DocumentationNavigationTree } from "../../../../shared/documentation";

import type { AppExampleNavigationGroup } from "../types/ExampleNavigation";

export function ExamplesNavigation({ groups }: Readonly<{ groups: readonly AppExampleNavigationGroup[] }>) {
  const { t } = useDevelopmentGuideTranslation();
  return <DocumentationNavigationTree groups={groups} navigationLabel={t("navigation.examples")} />;
}
