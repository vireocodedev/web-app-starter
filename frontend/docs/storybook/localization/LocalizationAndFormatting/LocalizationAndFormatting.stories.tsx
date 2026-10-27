import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocalizationAndFormattingExample } from "./LocalizationAndFormattingExample";

const meta = {
  title: "Development Guide/Localization/Localization and formatting",
  component: LocalizationAndFormattingExample,
  args: { scenario: "formatting" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the localization and formatting tutorial." } },
  },
} satisfies Meta<typeof LocalizationAndFormattingExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Numbers, currencies and dates" };
export const PluralsAndInterpolation: Story = {
  name: "Named values and numeric plurals",
  args: { scenario: "messages" },
};
export const TimeZones: Story = { name: "An explicit time zone", args: { scenario: "time-zones" } };
