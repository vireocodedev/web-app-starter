import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { LoadingEmptyAndErrorPresentationPanel } from "./components/LoadingEmptyAndErrorPresentationPanel/LoadingEmptyAndErrorPresentationPanel";
import { RowSelectionAndBulkActionsPanel } from "./components/RowSelectionAndBulkActionsPanel/RowSelectionAndBulkActionsPanel";
import { SortingAndPaginationPanel } from "./components/SortingAndPaginationPanel/SortingAndPaginationPanel";
import { UrlBackedFiltersPanel } from "./components/UrlBackedFiltersPanel/UrlBackedFiltersPanel";
const meta = {
  title: "Development Guide/Patterns/Tables And Collections",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const LoadingEmptyAndErrorPresentation: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/tables-and-collections" routePath="*">
      <LoadingEmptyAndErrorPresentationPanel />
    </PatternPreview>
  ),
};
export const RowSelectionAndBulkActions: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/tables-and-collections" routePath="*">
      <RowSelectionAndBulkActionsPanel />
    </PatternPreview>
  ),
};
export const SortingAndPagination: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/tables-and-collections" routePath="*">
      <SortingAndPaginationPanel />
    </PatternPreview>
  ),
};
export const UrlBackedFilters: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/tables-and-collections" routePath="*">
      <UrlBackedFiltersPanel />
    </PatternPreview>
  ),
};
