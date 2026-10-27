import { DocumentationPageNavigation } from "../../../../shared/documentation";

import type { AppExampleNavigationGroup } from "../types/ExampleNavigation";

export function ExamplePageNavigation({ groups }: Readonly<{ groups: readonly AppExampleNavigationGroup[] }>) {
  return (
    <DocumentationPageNavigation
      groups={groups}
      labels={{
        labelKey: "exampleGallery.pageNavigation.label",
        nextKey: "exampleGallery.pageNavigation.next",
        previousKey: "exampleGallery.pageNavigation.previous",
      }}
    />
  );
}
