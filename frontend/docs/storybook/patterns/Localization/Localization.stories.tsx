import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { DatesAndTimesPanel } from "./components/DatesAndTimesPanel/DatesAndTimesPanel";
import { InterpolationAndPluralsPanel } from "./components/InterpolationAndPluralsPanel/InterpolationAndPluralsPanel";
import { LocalizedMuiControlsPanel } from "./components/LocalizedMuiControlsPanel/LocalizedMuiControlsPanel";
import { NumbersPercentagesAndCurrenciesPanel } from "./components/NumbersPercentagesAndCurrenciesPanel/NumbersPercentagesAndCurrenciesPanel";
const meta = { title: "Development Guide/Patterns/Localization", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const DatesAndTimes: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/localization" routePath="*">
      <DatesAndTimesPanel />
    </PatternPreview>
  ),
};
export const InterpolationAndPlurals: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/localization" routePath="*">
      <InterpolationAndPluralsPanel />
    </PatternPreview>
  ),
};
export const LocalizedMuiControls: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/localization" routePath="*">
      <LocalizedMuiControlsPanel />
    </PatternPreview>
  ),
};
export const NumbersPercentagesAndCurrencies: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/localization" routePath="*">
      <NumbersPercentagesAndCurrenciesPanel />
    </PatternPreview>
  ),
};
