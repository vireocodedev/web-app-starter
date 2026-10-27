import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContactsPreview } from "./ContactsPreview";
const meta = {
  title: "Development Guide/Examples/Contacts",
  component: ContactsPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ContactsPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Directory: Story = {};
export const Dashboard: Story = { args: { dashboard: true } };
