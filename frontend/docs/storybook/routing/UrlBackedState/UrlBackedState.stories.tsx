import type { Meta, StoryObj } from "@storybook/react-vite";
import { UrlBackedStateExample } from "./UrlBackedStateExample";

const meta = {
  title: "Development Guide/Routing/URL-backed state",
  component: UrlBackedStateExample,
  args: { scenario: "overview" },
  argTypes: { scenario: { control: "select", options: ["overview", "invalid", "history"] } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the URL-backed state tutorial." } },
  },
} satisfies Meta<typeof UrlBackedStateExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const InvalidParameters: Story = { name: "Malformed parameters", args: { scenario: "invalid" } };
export const History: Story = { name: "Back and Forward", args: { scenario: "history" } };
