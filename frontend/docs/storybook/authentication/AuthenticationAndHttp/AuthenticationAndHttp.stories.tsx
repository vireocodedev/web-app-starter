import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthenticationAndHttpExample } from "./AuthenticationAndHttpExample";

const meta = {
  title: "Development Guide/Authentication/Authentication and HTTP integration",
  component: AuthenticationAndHttpExample,
  args: { scenario: "overview" },
  argTypes: {
    scenario: {
      control: "select",
      options: ["overview", "invalidCredentials", "unavailable", "csrfFailure", "expiry"],
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the complete authentication and HTTP tutorial." } },
  },
} satisfies Meta<typeof AuthenticationAndHttpExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
export const InvalidCredentials: Story = {
  name: "Invalid credentials and correction",
  args: { scenario: "invalidCredentials" },
};
export const ServerUnavailable: Story = { name: "Unavailable server and retry", args: { scenario: "unavailable" } };
export const CsrfFailure: Story = { name: "CSRF failure prevents submission", args: { scenario: "csrfFailure" } };
export const SessionExpiry: Story = { name: "Expired session clears private cache", args: { scenario: "expiry" } };
