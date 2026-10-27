import type { Meta, StoryObj } from "@storybook/react-vite";

import { ArchitectureExample } from "../shared/ArchitectureExample";

const meta = {
  title: "Development Guide/Architecture/Public module APIs",
  component: ArchitectureExample,
  args: { topic: "public-module-apis", initialCase: "named-feature-exports" },
  argTypes: { topic: { control: false }, initialCase: { control: false } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the source-backed architecture tutorial." } },
  },
} satisfies Meta<typeof ArchitectureExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const PrivateImplementation: Story = {
  name: "Private implementation",
  args: { initialCase: "private-implementation" },
};
