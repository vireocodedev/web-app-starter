import type { Meta, StoryObj } from "@storybook/react-vite";

import { DraftAndSubmitFormsExample } from "./DraftAndSubmitFormsExample";

const meta = {
  title: "Development Guide/Forms/Draft and submit forms",
  component: DraftAndSubmitFormsExample,
  args: { scenario: "overview" },
  parameters: {
    layout: "fullscreen",
    docs: { source: { code: "// Open Docs for the complete draft, submit and leave-guard recipes.", type: "code" } },
  },
} satisfies Meta<typeof DraftAndSubmitFormsExample>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const SaveFailure: Story = { args: { scenario: "save-failure" } };
export const ServerValidation: Story = { args: { scenario: "server-validation" } };
export const NavigationGuard: Story = { args: { scenario: "navigation" } };
export const UncertainOutcome: Story = { args: { scenario: "uncertain" } };
