import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatternPreview } from "../shared/PatternPreview";
import { ConfirmationDialogsPanel } from "./components/ConfirmationDialogsPanel/ConfirmationDialogsPanel";
import { ToastNotificationsPanel } from "./components/ToastNotificationsPanel/ToastNotificationsPanel";
const meta = { title: "Development Guide/Patterns/Feedback", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const ConfirmationDialogs: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/feedback" routePath="*">
      <ConfirmationDialogsPanel />
    </PatternPreview>
  ),
};
export const ToastNotifications: Story = {
  render: () => (
    <PatternPreview initialPath="/patterns/feedback" routePath="*">
      <ToastNotificationsPanel />
    </PatternPreview>
  ),
};
