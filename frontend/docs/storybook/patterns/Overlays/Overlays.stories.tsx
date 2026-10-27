import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { OverlayGuardsAndLifecyclePanel } from "./components/OverlayGuardsAndLifecyclePanel/OverlayGuardsAndLifecyclePanel";
import { OverlayPresentationsPanel } from "./components/OverlayPresentationsPanel/OverlayPresentationsPanel";
import { OverlayResultsAndCompositionPanel } from "./components/OverlayResultsAndCompositionPanel/OverlayResultsAndCompositionPanel";
const meta = { title: "Development Guide/Patterns/Overlays", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const OverlayGuardsAndLifecycle: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/overlays" routePath="*">
      <OverlayGuardsAndLifecyclePanel />
    </PatternPreview>
  ),
};
export const OverlayPresentations: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/overlays" routePath="*">
      <OverlayPresentationsPanel />
    </PatternPreview>
  ),
};
export const OverlayResultsAndComposition: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/overlays" routePath="*">
      <OverlayResultsAndCompositionPanel />
    </PatternPreview>
  ),
};
