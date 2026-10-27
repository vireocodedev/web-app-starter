import type { Meta, StoryObj } from "@storybook/react-vite";

import { CapabilityAwarePagesExample } from "./CapabilityAwarePagesExample";

const meta = {
  title: "Development Guide/Authentication/Capability-aware pages and actions",
  component: CapabilityAwarePagesExample,
  args: { scenario: "overview" },
  argTypes: { scenario: { control: "select", options: ["overview", "pageDenied", "actionDenied", "revocation"] } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete capability-aware pages tutorial." } },
  },
} satisfies Meta<typeof CapabilityAwarePagesExample>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const PageDenied: Story = { args: { scenario: "pageDenied" } };
export const ActionDenied: Story = { args: { scenario: "actionDenied" } };
export const Revocation: Story = { name: "Revocation during confirmation", args: { scenario: "revocation" } };
