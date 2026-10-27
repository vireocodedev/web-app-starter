import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { TextField } from "@mui/material";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, useSearchParams } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { AppNavigationLink } from "@/app/router/types/AppRoute";
import { AppShell } from "@/app/shell/components/AppShell";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => ({
    locale: "en",
    setLocale: vi.fn(),
  }),
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
          children: [
            {
              element: <p>Appearance content</p>,
              handle: { resolveBreadcrumbs: () => [], resolveTitle: () => "Appearance" },
              path: "appearance",
            },
          ],
          handle: {
            resolveBreadcrumbs: () => [{ label: "Unresolved project" }, { label: "Settings" }],
            resolveTitle: () => "Settings",
            scrollToTop: false,
          },
          path: "/projects/settings",
        },
      ],
      { initialEntries: ["/projects/settings/appearance"] },
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
    expect(within(screen.getByRole("banner")).queryByRole("link", { name: "Settings" })).toBeNull();
  });

  it("adds declared categories to the header and links back through their matched ancestry", async () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppShell navigationItems={[]} />,
          children: [
            {
              Component: Outlet,
              handle: { resolveBreadcrumbs: () => [], resolveTitle: () => "Workspace" },
              path: "/workspace-root",
              children: [
                { element: <p>Choose a category</p>, index: true },
                {
                  Component: Outlet,
                  handle: { headerBreadcrumb: true, resolveBreadcrumbs: () => [], resolveTitle: () => "Frontend" },
                  path: "frontend",
                  children: [{ element: <p>Frontend home</p>, path: "home" }],
                },
                {
                  element: <p>Hello world!</p>,
                  handle: { headerBreadcrumb: true, resolveBreadcrumbs: () => [], resolveTitle: () => "Backend" },
                  path: "backend",
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/workspace-root/frontend/home"] },
    );
    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );
    const header = () => within(screen.getByRole("banner"));
    expect(header().getByRole("heading", { level: 1 })).toHaveTextContent("Workspace");
    expect(header().getByRole("heading", { level: 1 })).toHaveTextContent("Frontend");
    expect(header().getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/workspace-root");
    expect(header().getByRole("link", { name: "Frontend" })).toHaveAttribute("href", "/workspace-root/frontend");

    await act(() => router.navigate("/workspace-root/backend"));
    expect(header().getByRole("heading", { level: 1 })).toHaveTextContent("Backend");
    expect(header().queryByRole("link", { name: "Backend" })).toBeNull();
    expect(header().queryByText("Frontend")).toBeNull();

    fireEvent.click(header().getByRole("link", { name: "Workspace" }));
    expect(await screen.findByText("Choose a category")).toBeVisible();
    expect(header().getByRole("heading", { level: 1 })).toHaveTextContent(/^Workspace$/);
    expect(header().queryByRole("link", { name: "Workspace" })).toBeNull();
  });

  it("uses the nearest nonempty section group for deep pages and inherits the outer group elsewhere", async () => {
    const outerSections: readonly AppNavigationLink[] = [
      { Icon: HomeOutlinedIcon, kind: "link", labelKey: "navigation.home", to: "/workspace-root/overview" },
    ];
    const workspaceSections: readonly AppNavigationLink[] = [
      {
        Icon: HomeOutlinedIcon,
        kind: "link",
        labelKey: "navigation.settings",
        to: "/workspace-root/workspace/settings",
      },
    ];
    const router = createMemoryRouter(
      [
        {
          element: <AppShell navigationItems={[]} />,
          path: "/workspace-root",
          handle: { sectionNavigation: outerSections },
          children: [
            { element: <p>Workspace overview</p>, path: "overview" },
            {
              Component: Outlet,
              path: "workspace",
              handle: { sectionNavigation: workspaceSections },
              children: [
                {
                  Component: Outlet,
                  path: "settings",
                  children: [
                    {
                      element: <p>Workspace setting details</p>,
                      path: "details",
                      handle: { sectionNavigation: [] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/workspace-root/workspace/settings/details"] },
    );
    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );
    const sections = () => within(screen.getByRole("navigation", { name: "navigation.sections" }));
    expect(screen.getByText("Workspace setting details")).toBeVisible();
    expect(sections().getByRole("link", { name: "navigation.settings" })).toHaveAttribute(
      "href",
      "/workspace-root/workspace/settings",
    );
    expect(sections().getByRole("link", { name: "navigation.settings" })).toHaveAttribute("aria-current", "page");
    expect(sections().queryByRole("link", { name: "navigation.home" })).toBeNull();

    await act(() => router.navigate("/workspace-root/overview"));
    expect(screen.getByText("Workspace overview")).toBeVisible();
    expect(sections().getByRole("link", { name: "navigation.home" })).toHaveAttribute(
      "href",
      "/workspace-root/overview",
    );
    expect(sections().getByRole("link", { name: "navigation.home" })).toHaveAttribute("aria-current", "page");
    expect(sections().queryByRole("link", { name: "navigation.settings" })).toBeNull();
  });

  it("retains the deepest dynamic header context after category breadcrumbs", () => {
    const router = createMemoryRouter(
      [
        {
          element: <AppShell navigationItems={[]} />,
          children: [
            {
              Component: Outlet,
              handle: {
                HeaderContext: () => <span>Parent context</span>,
                resolveBreadcrumbs: () => [],
                resolveTitle: () => "Workspace",
              },
              path: "/workspace",
              children: [
                {
                  Component: Outlet,
                  handle: { headerBreadcrumb: true, resolveBreadcrumbs: () => [], resolveTitle: () => "Frontend" },
                  path: "frontend",
                  children: [
                    {
                      element: <p>Project content</p>,
                      handle: {
                        HeaderContext: ({ params }: { params: Readonly<{ projectId?: string }> }) => (
                          <span>{params.projectId}</span>
                        ),
                        resolveBreadcrumbs: () => [],
                        resolveTitle: () => "Project page",
                      },
                      path: ":projectId",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/workspace/frontend/orion"] },
    );
    render(
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>,
    );
    const headerContext = document.querySelector("[data-rgo-header-context]");
    expect(headerContext).toHaveTextContent("Workspace");
    expect(headerContext).toHaveTextContent(/Frontend\s*\/\s*orion/);
    expect(headerContext).not.toHaveTextContent("Parent context");
    expect(screen.getByRole("banner").querySelector("h1")).not.toHaveTextContent("Project page");
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
