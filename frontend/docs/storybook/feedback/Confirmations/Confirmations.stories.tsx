import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConfirmationsExample } from "./ConfirmationsExample";

const meta = {
  title: "Development Guide/Feedback/Confirmations",
  component: ConfirmationsExample,
  args: { scenario: "standard", failSave: false, delayMs: 600 },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the shared feedback confirmation tutorial." } },
  },
} satisfies Meta<typeof ConfirmationsExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = { name: "Confirm before a command" };
export const Destructive: Story = { name: "Delete an exact target", args: { scenario: "destructive" } };
export const FailedAction: Story = {
  name: "Confirmed command fails",
  args: { scenario: "destructive", failSave: true },
};
export const DirtyEditor: Story = { name: "Unsaved editor guard", args: { scenario: "dirty" } };
export const Abortable: Story = { name: "Caller cancels an expired request", args: { scenario: "abortable" } };
export const Mobile: Story = {
  name: "Mobile confirmation",
  args: { scenario: "destructive" },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
