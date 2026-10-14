import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { SettingsPageNavigation } from "@/features/settings/components/SettingsPageNavigation";

const links = Array.from({ length: 30 }, (_, index) => ({
  Icon: BrushOutlinedIcon,
  label: index === 0 ? "Appearance" : `Settings section ${index} with a descriptive multiline label`,
  to: index === 0 ? "/settings/appearance" : `/settings/page-${index}`,
}));

let resize: ((width: number) => void) | undefined;
let observedContainer: Element | undefined;
const disconnect = vi.fn();

function NavigationHarness() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  // The real shell owns this pathname focus behavior; keep it outside the page-navigation component.
  useEffect(() => {
    if (previousPath.current !== location.pathname) mainRef.current?.focus();
    previousPath.current = location.pathname;
  }, [location.pathname]);
  return (
    <>
      <div data-testid="settings-container" ref={setContainer}>
        <SettingsPageNavigation container={container} links={links} />
      </div>
      <main data-testid="main-content" ref={mainRef} tabIndex={-1}>
        {location.pathname}
        {location.search}
        {location.hash}
      </main>
      <button onClick={() => void navigate("/settings/page-4")}>Navigate outside sheet</button>
    </>
  );
}

function renderNavigation(locale: "en" | "hr" = "en", initialPath = "/settings/appearance") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppLocalizationProvider initialLocale={locale}>
        <NavigationHarness />
      </AppLocalizationProvider>
    </MemoryRouter>,
  );
}

async function waitUntilClosed() {
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
}

describe("SettingsPageNavigation", () => {
  beforeEach(() => {
    disconnect.mockReset();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = width =>
            callback(
              [{ target: observedContainer!, contentRect: { width } } as ResizeObserverEntry],
              this as unknown as ResizeObserver,
            );
        }
        observe(target: Element) {
          observedContainer = target;
        }
        disconnect = disconnect;
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resize = undefined;
    observedContainer = undefined;
  });

  it("exposes every page in a long list with real destinations and exactly one active page", async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole("button", { name: "Choose Settings page: Appearance" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Settings pages" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", dialog.id);
    const destinations = within(dialog).getAllByRole("link");
    expect(destinations).toHaveLength(30);
    expect(destinations.filter(link => link.getAttribute("aria-current") === "page")).toHaveLength(1);
    expect(destinations[0]).toHaveAttribute("aria-current", "page");
    expect(destinations[29]).toHaveAttribute("href", "/settings/page-29");
    await user.click(destinations[29]!);
    await waitUntilClosed();
    await waitFor(() => expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/page-29"));
    await waitFor(() => expect(screen.getByTestId("main-content")).toHaveFocus());
    await user.click(screen.getByRole("button", { name: `Choose Settings page: ${links[29]!.label}` }));
    const updatedDialog = screen.getByRole("dialog", { name: "Settings pages" });
    expect(within(updatedDialog).getByRole("link", { name: links[29]!.label })).toHaveAttribute("aria-current", "page");
    expect(within(updatedDialog).getByRole("link", { name: "Appearance" })).not.toHaveAttribute("aria-current");
  });

  it("returns focus to the selector after Escape, the close action, or the backdrop", async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole("button", { name: "Choose Settings page: Appearance" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitUntilClosed();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close Settings pages" }));
    await waitUntilClosed();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    await waitUntilClosed();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/appearance");
  });

  it("opens and switches pages from the keyboard, leaving focus with main content", async () => {
    const user = userEvent.setup();
    renderNavigation();
    screen.getByRole("button", { name: "Choose Settings page: Appearance" }).focus();
    await user.keyboard("{Enter}");
    const destination = within(screen.getByRole("dialog", { name: "Settings pages" })).getByRole("link", {
      name: links[2]!.label,
    });
    destination.focus();
    await user.keyboard("{Enter}");
    await waitUntilClosed();
    await waitFor(() => expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/page-2"));
    await waitFor(() => expect(screen.getByTestId("main-content")).toHaveFocus());
  });

  it("keeps the current page's query and fragment when its link dismisses the sheet", async () => {
    const user = userEvent.setup();
    renderNavigation("en", "/settings/appearance?preview=1#theme");
    const trigger = screen.getByRole("button", { name: "Choose Settings page: Appearance" });
    await user.click(trigger);
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Appearance" }));
    await waitUntilClosed();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/appearance?preview=1#theme");
  });

  it("preserves modified-click behavior on section links", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await user.click(screen.getByRole("button", { name: "Choose Settings page: Appearance" }));
    const link = within(screen.getByRole("dialog")).getAllByRole("link")[1]!;
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/appearance");
  });

  it("closes on a container resize into the rail and does not reopen on shrinking", async () => {
    const user = userEvent.setup();
    const { unmount } = renderNavigation();
    expect(observedContainer).toBe(screen.getByTestId("settings-container"));
    await user.click(screen.getByRole("button", { name: "Choose Settings page: Appearance" }));
    act(() => resize?.(899));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => resize?.(900));
    await waitUntilClosed();
    act(() => resize?.(700));
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("closes after external navigation without stealing the shell's content focus", async () => {
    const user = userEvent.setup();
    renderNavigation();
    const outsideAction = screen.getByRole("button", { name: "Navigate outside sheet" });
    await user.click(screen.getByRole("button", { name: "Choose Settings page: Appearance" }));
    fireEvent.click(outsideAction);
    await waitUntilClosed();
    await waitFor(() => expect(screen.getByTestId("main-content")).toHaveFocus());
    expect(screen.getByTestId("main-content")).toHaveTextContent("/settings/page-4");
    expect(screen.getByRole("button", { name: `Choose Settings page: ${links[4]!.label}` })).toBeInTheDocument();
  });

  it("provides Croatian selector, sheet, and close-action labels", async () => {
    const user = userEvent.setup();
    renderNavigation("hr");
    await user.click(screen.getByRole("button", { name: "Odaberite stranicu postavki: Appearance" }));
    expect(screen.getByRole("dialog", { name: "Stranice postavki" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zatvori stranice postavki" })).toBeInTheDocument();
  });
});
