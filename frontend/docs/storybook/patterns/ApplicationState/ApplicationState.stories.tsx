import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { EffectsAndCleanupPanel } from "./components/EffectsAndCleanupPanel/EffectsAndCleanupPanel";
import { PersistentStatePanel } from "./components/PersistentStatePanel/PersistentStatePanel";
import { SharingStateBetweenRoutesPanel } from "./components/SharingStateBetweenRoutesPanel/SharingStateBetweenRoutesPanel";
import { SourceAndComputedSignalsPanel } from "./components/SourceAndComputedSignalsPanel/SourceAndComputedSignalsPanel";
const meta = { title: "Development Guide/Patterns/Application State", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const EffectsAndCleanup: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/application-state" routePath="*" signals>
      <EffectsAndCleanupPanel />
    </PatternPreview>
  ),
};
export const PersistentState: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/application-state" routePath="*" signals>
      <PersistentStatePanel />
    </PatternPreview>
  ),
};
export const SharingStateBetweenRoutes: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/application-state" routePath="*" signals>
      <SharingStateBetweenRoutesPanel />
    </PatternPreview>
  ),
};
export const SourceAndComputedSignals: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/application-state" routePath="*" signals>
      <SourceAndComputedSignalsPanel />
    </PatternPreview>
  ),
};
