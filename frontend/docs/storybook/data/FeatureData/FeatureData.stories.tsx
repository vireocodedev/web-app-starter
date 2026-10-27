import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeatureDataExample } from "./FeatureDataExample";

const meta = {
  title: "Development Guide/Data/Loading and saving feature data",
  component: FeatureDataExample,
  args: { scenario: "overview" },
  argTypes: {
    scenario: { control: "select", options: ["overview", "readFailure", "saveFailure", "empty", "cancellation"] },
  },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete feature data tutorial." } },
  },
} satisfies Meta<typeof FeatureDataExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const ReadFailure: Story = { name: "Read failure and retry", args: { scenario: "readFailure" } };
export const SaveFailure: Story = { name: "Save rejection and retry", args: { scenario: "saveFailure" } };
export const Empty: Story = { name: "Empty collection", args: { scenario: "empty" } };
export const Cancellation: Story = { name: "Cancel an obsolete read", args: { scenario: "cancellation" } };
