import type { Meta, StoryObj } from "@storybook/react-vite";

import { SettingsAwareComponentsExample } from "./SettingsAwareComponentsExample";

const meta = {
  title: "Development Guide/Settings/Components that respect application settings",
  component: SettingsAwareComponentsExample,
  args: { scenario: "overview" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the settings-aware components tutorial." } },
  },
} satisfies Meta<typeof SettingsAwareComponentsExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Effective settings and semantic surfaces" };
export const DisplayPreferences: Story = { name: "Density and editor presentation", args: { scenario: "display" } };
export const FixedSettings: Story = { name: "Fixed false and guarded setters", args: { scenario: "fixed" } };
