import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appNavigationItems } from "@/app/router/routeRegistry";
import { AppNavigation } from "@/app/shell/components/AppNavigation";
import type { AppNavigationItem } from "@/app/router/types/AppRoute";

vi.mock("@/app/localization/hooks/useAppTranslation", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

function CurrentPathname() {
  return <output>{useLocation().pathname}</output>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppNavigation", () => {
  it("shows only Home in the permanent drawer with a separate active marker", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavigation navigationItems={appNavigationItems} variant="panel" />
      </MemoryRouter>,
    );
    const home = screen.getByRole("link", { name: "navigation.home" });
    expect(home).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "navigation.settings" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Development guide" })).toBeNull();
    const activeLine = home.closest("li")?.querySelector("[data-rgo-active-line]");
    expect(activeLine).not.toBeNull();
    expect(activeLine).toHaveAttribute("aria-hidden", "true");
    expect(home.contains(activeLine ?? null)).toBe(false);
  });

  it("navigates from the temporary drawer and calls its dismissal callback", () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/settings/appearance"]}>
        <AppNavigation navigationItems={appNavigationItems} onNavigate={onNavigate} variant="drawer" />
        <CurrentPathname />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "navigation.settings" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "navigation.home" }));
    expect(screen.getByRole("status")).toHaveTextContent("/");
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("keeps an explicitly supplied nested destination reachable", () => {
    const items: readonly AppNavigationItem[] = [
      {
        activePath: "/projects/*",
        Icon: HomeOutlinedIcon,
        items: [
          {
            Icon: SettingsOutlinedIcon,
            kind: "link",
            labelKey: "navigation.settings",
            to: "/projects/atlas",
          },
        ],
        kind: "menu",
        labelKey: "navigation.home",
      },
    ];
    render(
      <MemoryRouter initialEntries={["/projects/atlas"]}>
        <AppNavigation navigationItems={items} variant="panel" />
      </MemoryRouter>,
    );
    const trigger = screen.getByRole("button", { name: "navigation.home" });
    expect(trigger).toHaveAttribute("aria-current", "page");
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "navigation.settings" })).toHaveAttribute("href", "/projects/atlas");
  });
});
