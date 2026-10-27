import type { Meta, StoryObj } from "@storybook/react-vite";

import { TablesAndCollectionsExample } from "./TablesAndCollectionsExample";

const meta = {
  title: "Development Guide/Collections/Tables and collections",
  component: TablesAndCollectionsExample,
  args: { mode: "local", initialResult: "ready" },
  parameters: {
    layout: "fullscreen",
    docs: {
      source: { type: "code", code: "// Open Docs for client/server collection ownership and table implementation." },
    },
  },
} satisfies Meta<typeof TablesAndCollectionsExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClientCollection: Story = { name: "Client collection" };
export const ServerCollection: Story = { name: "Server collection", args: { mode: "server" } };
export const Empty: Story = { args: { initialResult: "empty" } };
export const ReadFailure: Story = { name: "Read failure and retry", args: { mode: "server", initialResult: "failed" } };
export const InitialLoading: Story = { name: "Initial loading", args: { mode: "server", initialResult: "loading" } };
