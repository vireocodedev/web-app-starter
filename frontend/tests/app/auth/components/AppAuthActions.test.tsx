import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { AppAuthActions } from "@/app/auth/components/AppAuthActions";
import { AppAuthContext } from "@/app/auth/contexts/AppAuthContext";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";

function AccountHarness() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) mainRef.current?.focus();
    previousPath.current = location.pathname;
  }, [location.pathname]);
  return (
    <>
      <AppAuthActions />
      <main ref={mainRef} tabIndex={-1}>
        {location.pathname}
        {location.search}
        {location.hash}
      </main>
      <button onClick={() => void navigate("/external-change")}>Navigate outside menu</button>
    </>
  );
}

function renderAccount(initialEntry = "/", locale: "en" | "hr" = "en") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppLocalizationProvider initialLocale={locale}>
        <AppAuthContext
          value={{
            isLoggingOut: false,
            login: vi.fn(),
            logout: vi.fn(),
            status: "authenticated",
            user: { displayName: "Demo User", email: "demo@example.com", id: "demo" },
          }}
        >
          <AccountHarness />
        </AppAuthContext>
      </AppLocalizationProvider>
    </MemoryRouter>,
  );
}

async function waitUntilClosed() {
  await waitFor(() => expect(document.querySelector(".MuiModal-root")).toBeNull());
}

describe("AppAuthActions", () => {
  it("opens a modal menu with standard arrow-key navigation and restores focus on Escape", async () => {
    const user = userEvent.setup();
    renderAccount();
    const launcher = screen.getByRole("button", { name: "Account DU" });
    expect(launcher).toHaveAttribute("aria-haspopup", "menu");
    await user.click(launcher);
    expect(screen.getByRole("menu", { name: "Account" })).toBeVisible();
    expect(document.querySelector(".MuiBackdrop-root")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("menuitem", { name: "Development guide" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
  });

  it("dismisses on backdrop and Tab while retaining the current page", async () => {
    const user = userEvent.setup();
    renderAccount();
    const launcher = screen.getByRole("button", { name: "Account DU" });
    await user.click(launcher);
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
    expect(screen.getByRole("main")).toHaveTextContent("/");
    await user.click(launcher);
    await user.keyboard("{Tab}");
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
  });

  it("releases the menu before navigating so the destination owns focus", async () => {
    const user = userEvent.setup();
    renderAccount();
    await user.click(screen.getByRole("button", { name: "Account DU" }));
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));
    await waitUntilClosed();
    // MemoryRouter schedules navigation after modal release; wait for the shell's pathname
    // effect as well as the preceding menu teardown before asserting destination focus.
    await waitFor(() => {
      expect(screen.getByRole("main")).toHaveTextContent("/settings/appearance");
      expect(screen.getByRole("main")).toHaveFocus();
    });
  });

  it("preserves current-page query and fragment and keeps real links for modified clicks", async () => {
    const user = userEvent.setup();
    renderAccount("/settings/appearance?mode=preview#theme");
    const launcher = screen.getByRole("button", { name: "Account DU" });
    await user.click(launcher);
    const settings = screen.getByRole("menuitem", { name: "Settings" });
    expect(settings).toHaveAttribute("href", "/settings/appearance");
    expect(fireEvent.click(settings, { ctrlKey: true })).toBe(true);
    expect(screen.getByRole("menu", { name: "Account" })).toBeVisible();
    await user.click(settings);
    await waitUntilClosed();
    expect(screen.getByRole("main")).toHaveTextContent("/settings/appearance?mode=preview#theme");
    expect(launcher).toHaveFocus();
  });

  it("does not reclaim focus after external navigation while the menu is open", async () => {
    const user = userEvent.setup();
    renderAccount();
    const externalNavigation = screen.getByRole("button", { name: "Navigate outside menu" });
    await user.click(screen.getByRole("button", { name: "Account DU" }));
    fireEvent.click(externalNavigation);
    await waitUntilClosed();
    expect(screen.getByRole("main")).toHaveTextContent("/external-change");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("labels the menu and actions in Croatian", async () => {
    const user = userEvent.setup();
    renderAccount("/", "hr");
    await user.click(screen.getByRole("button", { name: "Račun DU" }));
    expect(screen.getByRole("menu", { name: "Račun" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Postavke" })).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "Odjava" })).toBeVisible();
  });
});
