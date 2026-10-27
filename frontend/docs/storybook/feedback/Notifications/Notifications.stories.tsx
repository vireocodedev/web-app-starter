import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationsExample } from "./NotificationsExample";

const meta = {
  title: "Development Guide/Feedback/Notifications",
  component: NotificationsExample,
  args: { scenario: "save", failSave: false, delayMs: 600 },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the shared feedback notification tutorial." } },
  },
} satisfies Meta<typeof NotificationsExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = { name: "Notify after saving" };
export const SaveFailure: Story = { name: "Rejected save", args: { failSave: true } };
export const Action: Story = { name: "Action and local undo", args: { scenario: "action" } };
export const Lifecycle: Story = { name: "Persistence, dismissal and replacement", args: { scenario: "lifecycle" } };
export const Mobile: Story = {
  name: "Mobile notifications",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
