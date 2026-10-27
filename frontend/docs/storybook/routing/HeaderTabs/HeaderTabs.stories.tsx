import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderTabsPreview } from "./HeaderTabsPreview";

type StoryArgs = { initialPath: string };

const meta = {
  title: "Development Guide/Routing/Pages with header tabs",
  args: { initialPath: "/workspace" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete route registry and layout recipe." } },
  },
  render: args => <HeaderTabsPreview initialPath={args.initialPath} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultChild: Story = { name: "Default child redirect" };
export const Activity: Story = { name: "Direct entry to Activity", args: { initialPath: "/workspace/activity" } };
export const ActivityDetails: Story = {
  name: "A descendant keeps its tab active",
  args: { initialPath: "/workspace/activity/details" },
};
export const Mobile: Story = {
  name: "Mobile section menu",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
