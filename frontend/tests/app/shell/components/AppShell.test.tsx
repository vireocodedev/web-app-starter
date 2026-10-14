import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { TextField } from "@mui/material";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, useSearchParams } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/app/shell/components/AppShell";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => ({
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/app/localization/hooks/useAppTranslation", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

function UrlFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get("query") ?? "";

  return (
    <TextField
      label="Filter"
      onChange={event => setSearchParams({ query: event.target.value }, { replace: true })}
      value={value}
    />
  );
}

describe("AppShell", () => {
  it.each([1023, 1024])("shows the home-logo control only from the desktop breakpoint at %ipx", width => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes("min-width:1024px") && width >= 1024,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    try {
      const router = createMemoryRouter([{ element: <AppShell navigationItems={[]} />, path: "/" }]);
      render(
        <AppThemeProvider>
          <RouterProvider router={router} />
        </AppThemeProvider>,
      );
      const logo = screen.queryByRole("link", { name: "navigation.goHome" });
      if (width < 1024) expect(logo).toBeNull();
      else expect(logo).toHaveAttribute("href", "/");
      expect(screen.getByRole("button", { name: "navigation.menu" })).toBeVisible();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("shows top-level context in the header without a duplicate page heading", () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppShell navigationItems={[]} />,
          handle: {
            resolveBreadcrumbs: () => [{ label: "Unresolved project" }, { label: "Settings" }],
            resolveTitle: () => "Settings",
            scrollToTop: false,
          },
          path: "/projects/settings",
        },
      ],
      { initialEntries: ["/projects/settings"] },
    );

    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );

    expect(screen.queryByText("Unresolved project")).toBeNull();
    expect(document.querySelector("[data-rgo-header-context]")).toHaveTextContent("Settings");
    expect(screen.getByRole("banner").querySelector("h1")).toHaveTextContent("Settings");
    expect(document.querySelector("#main-content h1")).toBeNull();
  });

  it("uses the deepest route to show or hide mobile bottom navigation", async () => {
    const router = createMemoryRouter(
      [
        {
          children: [
            { element: <div>Visible</div>, path: "visible" },
            { element: <div>Hidden</div>, handle: { mobileBottomNavigation: false }, path: "hidden" },
            { element: <div>Shown explicitly</div>, handle: { mobileBottomNavigation: true }, path: "shown" },
            {
              children: [{ element: <div>Child defaults visible</div>, path: "child" }],
              element: (
                <div>
                  <Outlet />
                </div>
              ),
              handle: { mobileBottomNavigation: false },
              path: "parent",
            },
          ],
          element: (
            <AppShell
              bottomNavigationItems={[
                { Icon: HomeOutlinedIcon, kind: "link", labelKey: "navigation.home", to: "/visible" },
              ]}
              navigationItems={[]}
            />
          ),
          path: "/",
        },
      ],
      { initialEntries: ["/visible"] },
    );
    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );
    const bottomNavigation = () => screen.queryByRole("navigation", { name: "navigation.bottom" });
    expect(bottomNavigation()).toBeVisible();
    await act(() => router.navigate("/hidden"));
    expect(bottomNavigation()).toBeNull();
    await act(() => router.navigate("/shown"));
    expect(bottomNavigation()).toBeVisible();
    await act(() => router.navigate("/parent/child"));
    expect(bottomNavigation()).toBeVisible();
  });

  it("keeps app-provided header actions available directly on mobile", () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppShell headerActions={<button type="button">Custom action</button>} navigationItems={[]} />,
          path: "/",
        },
      ],
      { initialEntries: ["/"] },
    );

    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Custom action" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "navigation.moreNavigation" })).toBeNull();
  });

  it("omits header locale and theme controls when they are fixed", () => {
    const fixedSettings = {
      ...noFixedAppSettings,
      locale: "en" as const,
      theme: "dark" as const,
    };
    const router = createMemoryRouter(
      [
        {
          element: <AppShell fixedSettings={fixedSettings} navigationItems={[]} />,
          path: "/",
        },
      ],
      { initialEntries: ["/"] },
    );

    render(
      <AppThemeProvider fixedSettings={fixedSettings}>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );

    expect(screen.queryByRole("button", { name: "locale.choose" })).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: "settings.theme",
      }),
    ).toBeNull();
  });

  it("preserves focus for URL-state edits and restores it after route changes", async () => {
    const router = createMemoryRouter(
      [
        {
          children: [
            { element: <UrlFilter />, path: "filters" },
            { element: <div>Other route</div>, path: "other" },
          ],
          element: <AppShell navigationItems={[]} />,
          path: "/",
        },
      ],
      { initialEntries: ["/filters"] },
    );

    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );

    const input = screen.getByRole("textbox", { name: "Filter" });
    input.focus();
    fireEvent.change(input, { target: { value: "a" } });
    await waitFor(() => expect(router.state.location.search).toBe("?query=a"));
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "atlas" } });
    await waitFor(() => expect(router.state.location.search).toBe("?query=atlas"));
    expect(input).toHaveFocus();
    expect(input).toHaveValue("atlas");

    await act(() => router.navigate("/other"));

    expect(screen.getByText("Other route")).toBeVisible();
    expect(document.querySelector("#main-content")).toHaveFocus();
  });
});
