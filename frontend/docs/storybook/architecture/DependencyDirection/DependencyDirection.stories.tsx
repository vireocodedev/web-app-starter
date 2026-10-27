import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArchitectureExample } from "../shared/ArchitectureExample";

const meta = {
  title: "Development Guide/Architecture/Dependency direction",
  component: ArchitectureExample,
  args: { topic: "dependency-direction", initialCase: "page-composition" },
  argTypes: { topic: { control: false }, initialCase: { control: false } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the source-backed architecture tutorial." } },
  },
} satisfies Meta<typeof ArchitectureExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const ShellBoundary: Story = { name: "Shell boundary", args: { initialCase: "shell-presentation" } };
