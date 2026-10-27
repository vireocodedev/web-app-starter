import type { Meta, StoryObj } from "@storybook/react-vite";

import { EntityFormExample } from "./EntityFormExample";

const meta = {
  title: "Development Guide/Forms/Entity forms",
  component: EntityFormExample,
  args: { mode: "create", failFirstSave: false, saveDelayMs: 600 },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete localized entity form tutorial." } },
  },
} satisfies Meta<typeof EntityFormExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = { name: "Create a contact" };
export const Update: Story = { name: "Update an existing contact", args: { mode: "update" } };
export const SaveFailure: Story = { name: "Failed save and retry", args: { failFirstSave: true } };
export const SlowSave: Story = { name: "Awaiting a slow save", args: { saveDelayMs: 3000 } };
export const Mobile: Story = {
  name: "Mobile form",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
