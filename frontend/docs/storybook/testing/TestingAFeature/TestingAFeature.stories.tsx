import type { Meta, StoryObj } from "@storybook/react-vite";

import { TestingAFeatureExample } from "./TestingAFeatureExample";

const meta = {
  title: "Development Guide/Testing/Testing a feature",
  component: TestingAFeatureExample,
  args: { initialScenario: "schema" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the numbered feature testing tutorial." } },
  },
} satisfies Meta<typeof TestingAFeatureExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Schema outcomes" };
export const AcceptedWrite: Story = {
  name: "Accepted write and scoped invalidation",
  args: { initialScenario: "accepted-write" },
};
export const RejectedWrite: Story = {
  name: "Rejected write and forbidden effects",
  args: { initialScenario: "rejected-write" },
};
