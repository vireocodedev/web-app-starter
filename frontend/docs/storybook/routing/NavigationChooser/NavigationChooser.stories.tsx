import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationChooserPreview } from "./NavigationChooserPreview";

type StoryArgs = { initialPath: string };

const meta = {
  title: "Development Guide/Routing/Navigation chooser pages",
  args: { initialPath: "/tools" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete navigation chooser and route recipe." } },
  },
  render: args => <NavigationChooserPreview initialPath={args.initialPath} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chooser: Story = { name: "Grouped page chooser" };
export const GettingStarted: Story = {
  name: "Direct entry to Getting started",
  args: { initialPath: "/tools/getting-started" },
};
export const Members: Story = { name: "Direct entry to Members", args: { initialPath: "/tools/members" } };
export const Mobile: Story = {
  name: "Mobile page chooser",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
