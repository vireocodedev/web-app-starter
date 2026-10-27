import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { ScopedErrorBoundaryPreview } from "./ScopedErrorBoundaryPreview";
import { RecoveryActionPreview } from "./RecoveryActionPreview";

const scopedBoundaryCode = `import {
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';

function WorkspaceRouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return <RouteFailure status={status} />;
}

const workspaceRoute = {
  path: 'workspace/*',
  Component: WorkspacePage,
  ErrorBoundary: WorkspaceRouteError,
};`;

const recoveryActionCode = `import { Link } from 'react-router';

function WorkspaceRouteError() {
  return (
    <Button component={Link} replace to="summary">
      Return to summary
    </Button>
  );
}`;

export function RouteRecoveryPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("routingExamples.recovery.contents.label"),
      title: t("routingExamples.recovery.contents.title"),
    },
    examples: [
      {
        code: scopedBoundaryCode,
        description: t("routingExamples.recovery.boundary.description"),
        id: "routing-scoped-error-boundary",
        sourcePath:
          "docs/storybook/patterns/RoutingAndUrlState/components/RouteRecoveryPanel/ScopedErrorBoundaryPreview.tsx",
        preview: <ScopedErrorBoundaryPreview />,
        title: t("routingExamples.recovery.boundary.title"),
      },
      {
        code: recoveryActionCode,
        description: t("routingExamples.recovery.action.description"),
        id: "routing-recovery-action",
        sourcePath:
          "docs/storybook/patterns/RoutingAndUrlState/components/RouteRecoveryPanel/RecoveryActionPreview.tsx",
        preview: <RecoveryActionPreview />,
        title: t("routingExamples.recovery.action.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
