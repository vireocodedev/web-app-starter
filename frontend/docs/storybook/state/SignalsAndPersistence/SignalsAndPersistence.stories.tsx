import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignalsAndPersistenceExample } from "./SignalsAndPersistenceExample";

const meta = {
  title: "Development Guide/State/Signals and persistence in practice",
  component: SignalsAndPersistenceExample,
  args: { scenario: "overview" },
  argTypes: { scenario: { control: "select", options: ["overview", "failure", "disposed"] } },
  parameters: {
    layout: "fullscreen",
    docs: { source: { type: "code", code: "// Open Docs for the Signals and persistence tutorial." } },
  },
} satisfies Meta<typeof SignalsAndPersistenceExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const StorageFailure: Story = { name: "Storage unavailable", args: { scenario: "failure" } };
export const DisposedEffect: Story = { name: "Disposed persistence", args: { scenario: "disposed" } };
