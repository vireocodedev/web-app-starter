import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { NestedRoutesPanel } from "./components/NestedRoutesPanel/NestedRoutesPanel";
import { RouteParametersAndBreadcrumbsPanel } from "./components/RouteParametersAndBreadcrumbsPanel/RouteParametersAndBreadcrumbsPanel";
import { RouteRecoveryPanel } from "./components/RouteRecoveryPanel/RouteRecoveryPanel";
import { SearchParametersPanel } from "./components/SearchParametersPanel/SearchParametersPanel";
const meta = {
  title: "Development Guide/Patterns/Routing And Url State",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const NestedRoutes: Story = {
  render: () => (
    <PatternPreview
      initialPath="/dev-guide/frontend/patterns/routing-and-url-state/nested-routes"
      routePath="/dev-guide/frontend/patterns/routing-and-url-state/nested-routes/*"
    >
      <NestedRoutesPanel />
    </PatternPreview>
  ),
};
export const RouteParametersAndBreadcrumbs: Story = {
  render: () => (
    <PatternPreview
      initialPath="/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas"
      routePath="/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId"
    >
      <RouteParametersAndBreadcrumbsPanel />
    </PatternPreview>
  ),
};
export const RouteRecovery: Story = {
  render: () => (
    <PatternPreview
      initialPath="/dev-guide/frontend/patterns/routing-and-url-state/route-level-recovery"
      routePath="/dev-guide/frontend/patterns/routing-and-url-state/route-level-recovery/*"
    >
      <RouteRecoveryPanel />
    </PatternPreview>
  ),
};
export const SearchParameters: Story = {
  render: () => (
    <PatternPreview initialPath="/dev-guide/frontend/patterns/routing-and-url-state/search-parameters" routePath="*">
      <SearchParametersPanel />
    </PatternPreview>
  ),
};
