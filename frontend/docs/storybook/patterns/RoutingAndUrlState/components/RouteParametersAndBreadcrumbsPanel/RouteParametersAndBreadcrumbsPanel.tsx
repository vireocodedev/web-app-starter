import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { DynamicRouteParameterPreview } from "./DynamicRouteParameterPreview";
import { BreadcrumbMetadataPreview } from "./BreadcrumbMetadataPreview";

const routeParameterCode = `import { generatePath, Link, Navigate, useParams } from 'react-router';

function ProjectRoute() {
  const { projectId } = useParams();
  if (!projectId) return <Navigate replace to="/projects" />;

  const projectPath = (id: string) =>
    generatePath('/projects/:projectId', { projectId: id });

  return (
    <>
      <ProjectSummary projectId={projectId} />
      <Button component={Link} to={projectPath('atlas')}>
        Open Atlas
      </Button>
    </>
  );
}
`;

const breadcrumbCode = `const projectRoute = {
  path: 'projects/:projectId',
  breadcrumbs: [
    { title: (t) => t('navigation.projects'), to: () => '/projects' },
  ],
  title: (t, { projectId }) => t('navigation.project', { projectId }),
};`;

export function RouteParametersAndBreadcrumbsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("routingExamples.parameters.contents.label"),
      title: t("routingExamples.parameters.contents.title"),
    },
    examples: [
      {
        code: routeParameterCode,
        description: t("routingExamples.parameters.route.description"),
        id: "routing-dynamic-route-parameter",
        sourcePath:
          "docs/storybook/patterns/RoutingAndUrlState/components/RouteParametersAndBreadcrumbsPanel/DynamicRouteParameterPreview.tsx",
        preview: <DynamicRouteParameterPreview />,
        title: t("routingExamples.parameters.route.title"),
      },
      {
        code: breadcrumbCode,
        description: t("routingExamples.parameters.breadcrumbs.description"),
        id: "routing-breadcrumb-metadata",
        sourcePath:
          "docs/storybook/patterns/RoutingAndUrlState/components/RouteParametersAndBreadcrumbsPanel/BreadcrumbMetadataPreview.tsx",
        preview: <BreadcrumbMetadataPreview />,
        title: t("routingExamples.parameters.breadcrumbs.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
