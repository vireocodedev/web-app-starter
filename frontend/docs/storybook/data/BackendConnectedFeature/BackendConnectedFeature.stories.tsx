import type { Meta, StoryObj } from "@storybook/react-vite";
import { BackendConnectedFeatureExample } from "./BackendConnectedFeatureExample";

const meta = {
  title: "Development Guide/Data/Building a backend-connected feature",
  component: BackendConnectedFeatureExample,
  args: { scenario: "overview" },
  argTypes: {
    scenario: { control: "select", options: ["overview", "validation", "missing", "malformed", "forbidden"] },
  },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete backend-connected feature recipe." } },
  },
} satisfies Meta<typeof BackendConnectedFeatureExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const ValidationFailure: Story = {
  name: "Validation failure and retained draft",
  args: { scenario: "validation" },
};
export const MissingRecord: Story = { name: "Missing record and read recovery", args: { scenario: "missing" } };
export const MalformedResponse: Story = {
  name: "Malformed write response and reconciliation",
  args: { scenario: "malformed" },
};
export const Forbidden: Story = { name: "Forbidden command", args: { scenario: "forbidden" } };
