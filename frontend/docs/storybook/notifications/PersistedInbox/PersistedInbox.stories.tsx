import type { Meta, StoryObj } from "@storybook/react-vite";
import { PersistedInboxExample } from "./PersistedInboxExample";

const meta = {
  title: "Development Guide/Notifications/Persisted inboxes versus feedback",
  component: PersistedInboxExample,
  args: { scenario: "overview" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the persisted inbox tutorial." } },
  },
} satisfies Meta<typeof PersistedInboxExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const ReadFailure: Story = { name: "Read failure and retry", args: { scenario: "readFailure" } };
export const MarkReadFailure: Story = { name: "Rejected read marker", args: { scenario: "markFailure" } };
export const Ownership: Story = { name: "Account ownership and hidden IDs", args: { scenario: "ownership" } };
