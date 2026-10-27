import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { AsyncSubmissionAndServerErrorsPanel } from "./components/AsyncSubmissionAndServerErrorsPanel/AsyncSubmissionAndServerErrorsPanel";
import { DependentFieldsPanel } from "./components/DependentFieldsPanel/DependentFieldsPanel";
import { DirtyStateAndNavigationGuardPanel } from "./components/DirtyStateAndNavigationGuardPanel/DirtyStateAndNavigationGuardPanel";
import { ValidationAndErrorPresentationPanel } from "./components/ValidationAndErrorPresentationPanel/ValidationAndErrorPresentationPanel";
import { AsyncLookupsPanel } from "./components/AsyncLookupsPanel/AsyncLookupsPanel";
import { RepeatedAndNestedFieldsPanel } from "./components/RepeatedAndNestedFieldsPanel/RepeatedAndNestedFieldsPanel";
const meta = { title: "Development Guide/Patterns/Forms", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const AsyncSubmissionAndServerErrors: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <AsyncSubmissionAndServerErrorsPanel />
    </PatternPreview>
  ),
};
export const DependentFields: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <DependentFieldsPanel />
    </PatternPreview>
  ),
};
export const DirtyStateAndNavigationGuard: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <DirtyStateAndNavigationGuardPanel />
    </PatternPreview>
  ),
};
export const ValidationAndErrorPresentation: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <ValidationAndErrorPresentationPanel />
    </PatternPreview>
  ),
};
export const AsyncLookups: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <AsyncLookupsPanel />
    </PatternPreview>
  ),
};
export const RepeatedAndNestedFields: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/forms" routePath="*">
      <RepeatedAndNestedFieldsPanel />
    </PatternPreview>
  ),
};
