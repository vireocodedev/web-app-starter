import type { Meta, StoryObj } from "@storybook/react-vite";
import { LeftNavigationPreview } from "./LeftNavigationPreview";

type StoryArgs = { initialPath: string; maxWidth: number };

const meta = {
  title: "Development Guide/Routing/Pages with left navigation",
  args: { initialPath: "/project", maxWidth: 1280 },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete page layout and route registry recipe." } },
  },
  render: args => <LeftNavigationPreview initialPath={args.initialPath} maxWidth={args.maxWidth} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultChild: Story = { name: "Default child redirect" };
export const Members: Story = { name: "Direct entry to Members", args: { initialPath: "/project/members" } };
export const Activity: Story = { name: "Direct entry to Activity", args: { initialPath: "/project/activity" } };
export const MemberDetails: Story = {
  name: "A descendant keeps Members selected",
  args: { initialPath: "/project/members/details" },
};
export const Mobile: Story = {
  name: "Mobile page selector",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const NarrowContent: Story = {
  name: "Narrow content on a wide screen",
  args: { maxWidth: 800 },
};
