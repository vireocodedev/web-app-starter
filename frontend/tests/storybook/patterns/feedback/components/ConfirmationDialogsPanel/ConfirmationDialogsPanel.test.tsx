import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmationDialogsPanel } from "../../../../../../docs/storybook/patterns/Feedback";

const feedback = vi.hoisted(() => ({
  confirm: vi.fn(),
  dismiss: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@rgo-web/frontend", () => ({
  useRgoFeedback: () => feedback,
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("ConfirmationDialogsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests standard, destructive, and abortable decisions", async () => {
    feedback.confirm.mockResolvedValue({ status: "confirmed" });
    render(<ConfirmationDialogsPanel />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.confirmationExamples.standard.action",
      }),
    );
    await waitFor(() =>
      expect(feedback.confirm).toHaveBeenLastCalledWith({
        cancelLabel: "feedback.confirmationExamples.standard.cancel",
        confirmLabel: "feedback.confirmationExamples.standard.confirm",
        message: "feedback.confirmationExamples.standard.message",
        title: "feedback.confirmationExamples.standard.dialogTitle",
      }),
    );
    expect(screen.getByText("feedback.confirmationExamples.standard.confirmed")).toBeVisible();

    feedback.confirm.mockResolvedValueOnce({ status: "cancelled" });
    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.confirmationExamples.destructive.action",
      }),
    );
    await waitFor(() =>
      expect(feedback.confirm).toHaveBeenLastCalledWith({
        cancelLabel: "feedback.confirmationExamples.destructive.cancel",
        confirmLabel: "feedback.confirmationExamples.destructive.confirm",
        destructive: true,
        message: "feedback.confirmationExamples.destructive.message",
        title: "feedback.confirmationExamples.destructive.dialogTitle",
      }),
    );
    expect(screen.getByText("feedback.confirmationExamples.destructive.cancelled")).toBeVisible();

    feedback.confirm.mockResolvedValueOnce({ status: "cancelled" });
    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.confirmationExamples.abortable.action",
      }),
    );
    await waitFor(() => expect(feedback.confirm).toHaveBeenCalledTimes(3));
    expect(feedback.confirm.mock.calls.at(-1)?.[0]).toMatchObject({
      cancelLabel: "feedback.confirmationExamples.abortable.cancel",
      confirmLabel: "feedback.confirmationExamples.abortable.confirm",
      message: "feedback.confirmationExamples.abortable.message",
      signal: expect.any(AbortSignal),
      title: "feedback.confirmationExamples.abortable.dialogTitle",
    });
  });
});
