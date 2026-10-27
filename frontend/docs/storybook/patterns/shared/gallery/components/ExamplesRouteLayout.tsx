import { DocumentationRouteLayout } from "../../../../shared/documentation";

export function ExamplesRouteLayout() {
  return (
    <DocumentationRouteLayout
      navigationLabelKey="navigation.examples"
      pageNavigationLabels={{
        labelKey: "exampleGallery.pageNavigation.label",
        nextKey: "exampleGallery.pageNavigation.next",
        previousKey: "exampleGallery.pageNavigation.previous",
      }}
    />
  );
}
