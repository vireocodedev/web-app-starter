import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArchitectureExample } from "../shared/ArchitectureExample";

const meta = {
  title: "Development Guide/Architecture/Runtime and state ownership",
  component: ArchitectureExample,
  args: { topic: "runtime-and-state", initialCase: "constructed-runtime" },
  argTypes: { topic: { control: false }, initialCase: { control: false } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the source-backed architecture tutorial." } },
  },
} satisfies Meta<typeof ArchitectureExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const StateOwnership: Story = { name: "State ownership", args: { initialCase: "state-ownership" } };
