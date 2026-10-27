import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReferenceReader } from "../../shared/documentation/ReferenceReader";

const meta = {
  title: "Development Guide/Handbook/Handbook",
  component: ReferenceReader,
  args: { kind: "handbook" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReferenceReader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const TransactionalCommands: Story = {
  args: { initialPath: "/handbook/backend/application-services/transactional-commands" },
};
