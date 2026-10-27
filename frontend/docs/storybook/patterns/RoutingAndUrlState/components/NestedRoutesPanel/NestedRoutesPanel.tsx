import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { NestedLayoutPreview } from "./NestedLayoutPreview";
import { DescendantRoutesPreview } from "./DescendantRoutesPreview";

const nestedLayoutCode = `import { Link, Outlet } from 'react-router';

function WorkspaceLayout() {
  return (
    <Stack>
      <Button component={Link} to="overview">Overview</Button>
      <Button component={Link} to="activity">Activity</Button>
      <Outlet />
    </Stack>
  );
}`;

const descendantRoutesCode = `import { Navigate, Route, Routes } from 'react-router';

// The registry route ends in /nested-routes/*.
<Routes>
  <Route path="workspace" element={<WorkspaceLayout />}>
    <Route index element={<Navigate replace to="overview" />} />
    <Route path="overview" element={<WorkspaceOverview />} />
    <Route path="activity" element={<WorkspaceActivity />} />
  </Route>
</Routes>`;

export function NestedRoutesPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("routingExamples.nested.contents.label"),
      title: t("routingExamples.nested.contents.title"),
    },
    examples: [
      {
        code: nestedLayoutCode,
        description: t("routingExamples.nested.layout.description"),
        id: "routing-nested-layout",
        sourcePath: "docs/storybook/patterns/RoutingAndUrlState/components/NestedRoutesPanel/NestedLayoutPreview.tsx",
        preview: <NestedLayoutPreview />,
        title: t("routingExamples.nested.layout.title"),
      },
      {
        code: descendantRoutesCode,
        description: t("routingExamples.nested.routes.description"),
        id: "routing-descendant-routes",
        sourcePath:
          "docs/storybook/patterns/RoutingAndUrlState/components/NestedRoutesPanel/DescendantRoutesPreview.tsx",
        preview: <DescendantRoutesPreview />,
        title: t("routingExamples.nested.routes.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
