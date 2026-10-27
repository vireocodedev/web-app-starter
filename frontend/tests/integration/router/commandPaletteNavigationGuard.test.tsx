import { RgoFeedbackProvider, useRgoFeedback } from "@rgo-web/frontend";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useBlocker } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { AppFixedSettingsProvider } from "@/app/bootstrap/config/AppFixedSettingsProvider";
import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { AuthenticatedAppShell } from "@/app/router/components/AuthenticatedAppShell";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { useEffect, useRef, useState } from "react";

/** Private domain fixture: no example feature is required by application integration tests. */
function GuardedDraftPreview() {
  const [title, setTitle] = useState("Saved draft");
  const input = useRef<HTMLInputElement>(null);
  const feedback = useRgoFeedback();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      title !== "Saved draft" && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const controller = new AbortController();
    void feedback
      .confirm({
        title: "Discard unsaved changes?",
        message: "Leave this draft?",
        confirmLabel: "Discard and leave",
        cancelLabel: "Keep editing",
        signal: controller.signal,
      })
      .then(result => {
        if (controller.signal.aborted) return;
        if (result.status === "confirmed") blocker.proceed();
        else {
          blocker.reset();
          input.current?.focus();
        }
      });
    return () => controller.abort();
  }, [blocker, feedback]);
  return (
    <label>
      Draft title
      <input ref={input} value={title} onChange={event => setTitle(event.target.value)} />
    </label>
  );
}

// Authentication is already established; this scenario exercises the actual router/shell/form seam.
vi.mock("@/app/auth/components/AppAuthActions", () => ({ AppAuthActions: () => null }));

function renderNavigation(initialEntry = "/draft") {
  const router = createMemoryRouter(
    [
      {
        element: <AuthenticatedAppShell bottomNavigationItems={[]} navigationItems={[]} />,
        children: [
          { element: <GuardedDraftPreview />, path: "/draft" },
          { element: <p>Accessibility destination</p>, path: "/settings/accessibility" },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <AppFixedSettingsProvider fixedSettings={noFixedAppSettings}>
      <AppLocalizationProvider initialLocale="en">
        <AppThemeProvider>
          <RgoFeedbackProvider notificationCloseLabel="Close notification">
            <RouterProvider router={router} />
          </RgoFeedbackProvider>
        </AppThemeProvider>
      </AppLocalizationProvider>
    </AppFixedSettingsProvider>,
  );
  return router;
}

async function chooseAccessibility(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Control>}k{/Control}");
  await user.type(screen.getByRole("combobox", { name: "Search pages" }), "accessibility");
  await user.keyboard("{Enter}");
}

describe("command palette navigation with the existing form blocker", () => {
  it("releases palette modal ownership before prompting, restores cancelled draft focus, and preserves successful route focus", async () => {
    const user = userEvent.setup();
    const router = renderNavigation("/draft?filter=recent#draft");
    const draft = screen.getByRole("textbox", { name: "Draft title" });
    await user.clear(draft);
    await user.type(draft, "Unsaved draft from the palette");
    await chooseAccessibility(user);

    expect(await screen.findByRole("dialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Search pages" })).toBeNull();
    expect(document.querySelectorAll(".MuiModal-root")).toHaveLength(1);
    expect(router.state.location.pathname).toBe("/draft");
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(document.querySelectorAll(".MuiModal-root")).toHaveLength(0));
    expect(draft).toHaveValue("Unsaved draft from the palette");
    expect(draft).toHaveFocus();
    expect(router.state.location.search).toBe("?filter=recent");
    expect(router.state.location.hash).toBe("#draft");

    await chooseAccessibility(user);
    expect(await screen.findByRole("dialog", { name: "Discard unsaved changes?" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Discard and leave" }));
    await screen.findByText("Accessibility destination");
    await waitFor(() => expect(document.querySelectorAll(".MuiModal-root")).toHaveLength(0));
    expect(router.state.location.pathname).toBe("/settings/accessibility");
    expect(document.querySelector("#main-content")).toHaveFocus();
  });

  it("closes a current-page selection without changing filters, fragment or browser history", async () => {
    const user = userEvent.setup();
    const router = renderNavigation("/settings/accessibility?contrast=high#controls");
    const before = router.state.location;
    await user.click(screen.getByRole("button", { name: "Search pages" }));
    const search = screen.getByRole("combobox", { name: "Search pages" });
    await user.type(search, "accessibility");
    expect(router.state.location).toEqual(before);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.querySelectorAll(".MuiModal-root")).toHaveLength(0));
    expect(router.state.location).toEqual(before);
    expect(router.state.historyAction).toBe("POP");
    expect(screen.getByRole("button", { name: "Search pages" })).toHaveFocus();
  });
});
