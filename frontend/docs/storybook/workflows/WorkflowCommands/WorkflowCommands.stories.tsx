import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkflowCommandsExample } from "./WorkflowCommandsExample";

const meta = {
  title: "Development Guide/Workflows/Workflow commands, conflicts and coordinated refresh",
  component: WorkflowCommandsExample,
  args: { scenario: "overview" },
  argTypes: { scenario: { control: "select", options: ["overview", "conflict", "refreshFailure", "uncertain"] } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete workflow command tutorial." } },
  },
} satisfies Meta<typeof WorkflowCommandsExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const Conflict: Story = { name: "Conflict preserves the decision basis", args: { scenario: "conflict" } };
export const RefreshFailure: Story = {
  name: "Accepted command with failed refresh",
  args: { scenario: "refreshFailure" },
};
export const UncertainOutcome: Story = {
  name: "Lost acknowledgement and reconciliation",
  args: { scenario: "uncertain" },
};
