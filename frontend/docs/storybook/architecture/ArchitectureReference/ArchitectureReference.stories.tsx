import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReferenceReader } from "../../shared/documentation/ReferenceReader";

const meta = {
  title: "Development Guide/Architecture/Architecture reference",
  component: ReferenceReader,
  args: { kind: "architecture" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReferenceReader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const SourceMap: Story = { args: { initialPath: "/architecture/source-map-and-ownership" } };
