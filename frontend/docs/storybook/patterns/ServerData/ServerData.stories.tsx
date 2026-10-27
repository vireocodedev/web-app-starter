import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { MutationsAndRefreshPanel } from "./components/MutationsAndRefreshPanel/MutationsAndRefreshPanel";
import { PaginationAndFilteringPanel } from "./components/PaginationAndFilteringPanel/PaginationAndFilteringPanel";
import { QueryStatesPanel } from "./components/QueryStatesPanel/QueryStatesPanel";
import { RequestCancellationPanel } from "./components/RequestCancellationPanel/RequestCancellationPanel";
import { OptimisticUpdatesAndRollbackPanel } from "./components/OptimisticUpdatesAndRollbackPanel/OptimisticUpdatesAndRollbackPanel";
const meta = { title: "Development Guide/Patterns/Server Data", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const MutationsAndRefresh: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/server-data" routePath="*">
      <MutationsAndRefreshPanel />
    </PatternPreview>
  ),
};
export const PaginationAndFiltering: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/server-data" routePath="*">
      <PaginationAndFilteringPanel />
    </PatternPreview>
  ),
};
export const QueryStates: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/server-data" routePath="*">
      <QueryStatesPanel />
    </PatternPreview>
  ),
};
export const RequestCancellation: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/server-data" routePath="*">
      <RequestCancellationPanel />
    </PatternPreview>
  ),
};
export const OptimisticUpdatesAndRollback: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/server-data" routePath="*">
      <OptimisticUpdatesAndRollbackPanel />
    </PatternPreview>
  ),
};
