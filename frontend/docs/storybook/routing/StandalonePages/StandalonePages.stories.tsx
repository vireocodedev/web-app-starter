import type { Meta, StoryObj } from "@storybook/react-vite";
import { StandalonePagesPreview } from "./StandalonePagesPreview";

type StoryArgs = { initialPath: string };

const meta = {
  title: "Development Guide/Routing/Standalone pages",
  args: { initialPath: "/reports" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete standalone page and route recipe." } },
  },
  render: args => <StandalonePagesPreview initialPath={args.initialPath} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reports: Story = { name: "Reports page" };
export const Support: Story = { name: "Direct entry to Support", args: { initialPath: "/support" } };
export const Mobile: Story = {
  name: "Mobile page",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
