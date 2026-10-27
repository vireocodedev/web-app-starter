import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { ToastNotificationsPanel } from "../../../../../../docs/storybook/patterns/Feedback";

const feedback = vi.hoisted(() => ({
  confirm: vi.fn(),
  dismiss: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@rgo-web/frontend", async importOriginal => ({
  ...(await importOriginal<typeof import("@rgo-web/frontend")>()),
  RgoFeedbackProvider: ({ children }: { children: ReactNode }) => children,
  useRgoFeedback: () => feedback,
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

function renderPanel() {
  return render(
    <AppThemeProvider>
      <ToastNotificationsPanel />
    </AppThemeProvider>,
  );
}

describe("ToastNotificationsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes each notification pattern through the shared feedback interface", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "feedback.examples.success.action" }));
    expect(feedback.notify).toHaveBeenLastCalledWith({
      id: "example-success-notification",
      message: "feedback.examples.success.message",
      severity: "success",
    });

    fireEvent.click(screen.getByRole("button", { name: "feedback.examples.action.action" }));
    const actionNotification = feedback.notify.mock.calls.at(-1)?.[0];
    expect(actionNotification).toMatchObject({
      id: "example-action-notification",
      message: "feedback.examples.action.message",
      severity: "info",
    });
    expect(actionNotification.action.label).toBe("feedback.examples.action.undo");

    actionNotification.action.onClick();
    expect(feedback.notify).toHaveBeenLastCalledWith({
      id: "example-action-notification",
      message: "feedback.examples.action.undoneMessage",
      severity: "success",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.examples.persistent.action",
      }),
    );
    expect(feedback.notify).toHaveBeenLastCalledWith({
      durationMs: null,
      id: "example-persistent-notification",
      message: "feedback.examples.persistent.message",
      severity: "warning",
    });

    fireEvent.click(screen.getByRole("button", { name: "feedback.examples.error.action" }));
    expect(feedback.notify).toHaveBeenLastCalledWith({
      id: "example-error-notification",
      message: "feedback.examples.error.message",
      severity: "error",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.examples.persistent.dismiss",
      }),
    );
    expect(feedback.dismiss).toHaveBeenCalledWith("example-persistent-notification");

    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.examples.replacement.initialAction",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "feedback.examples.replacement.updatedAction",
      }),
    );
    expect(feedback.notify).toHaveBeenLastCalledWith({
      id: "example-replacement-notification",
      message: "feedback.examples.replacement.updatedMessage",
      severity: "success",
    });
  });

  it("expands every TSX example by default and toggles individual snippets", async () => {
    renderPanel();

    const hideCodeButtons = screen.getAllByRole("button", {
      name: "exampleGallery.code.hide",
    });
    const codeBlocks = screen.getAllByLabelText("exampleGallery.code.language");

    expect(hideCodeButtons).toHaveLength(6);
    expect(codeBlocks).toHaveLength(6);
    hideCodeButtons.forEach(button => expect(button).toHaveAttribute("aria-expanded", "true"));
    codeBlocks.forEach(code => expect(code).toBeVisible());
    await waitFor(() => expect(codeBlocks[0]).toHaveTextContent("const feedback = useRgoFeedback();"));
    expect(codeBlocks[0]!.querySelector('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(hideCodeButtons.at(-1)!);
    const showCodeButton = screen.getByRole("button", {
      name: "exampleGallery.code.show",
    });
    expect(showCodeButton).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(codeBlocks.at(-1)).not.toBeVisible());
    codeBlocks.slice(0, -1).forEach(code => expect(code).toBeVisible());
    fireEvent.click(showCodeButton);
    expect(showCodeButton).toHaveAttribute("aria-expanded", "true");

    const componentTokens = await screen.findAllByText("RgoFeedbackProvider", {
      selector: '[data-code-token="component"]',
    });
    expect(componentTokens).toHaveLength(2);
    componentTokens.forEach(token => expect(token).toBeVisible());
  });

  it("links the table of contents to each example card", () => {
    renderPanel();

    expect(
      screen.getByRole("navigation", {
        name: "feedback.examples.contents.label",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "feedback.examples.success.title" })).toHaveAttribute(
      "href",
      "#toast-success",
    );
    expect(document.querySelector("#toast-success")).toBeVisible();
    expect(document.querySelector("#toast-replacement")).toBeVisible();
    expect(document.querySelector("#toast-position")).toBeVisible();
  });
});
