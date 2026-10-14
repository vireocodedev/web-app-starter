import { DocumentationRouteLayout } from "@/app/shell/documentation";

export function ArchitectureRouteLayout() {
  return (
    <DocumentationRouteLayout
      navigationLabelKey="navigation.architecture"
      pageNavigationLabels={{
        labelKey: "architectureGuide.pageNavigation.label",
        nextKey: "architectureGuide.pageNavigation.next",
        previousKey: "architectureGuide.pageNavigation.previous",
      }}
    />
  );
}
