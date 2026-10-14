import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppBottomNavigation } from "@/app/shell/components/AppBottomNavigation";
import { AppBottomNavigationLabel } from "@/app/shell/components/AppBottomNavigationLabel";

const translations = vi.hoisted(() => ({ labels: {} as Record<string, string> }));
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({
  useAppTranslation: () => ({ t: (key: string) => translations.labels[key] ?? key }),
}));
vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => translations.labels[key] ?? key }),
}));

describe("mobile shortcut label fitting", () => {
  let availableWidth: number;
  let fontWidthScale: number;
  let observers: Array<{
    callback: ResizeObserverCallback;
    disconnect: ReturnType<typeof vi.fn>;
    observe: ReturnType<typeof vi.fn>;
  }>;
  let fonts: EventTarget & { ready: Promise<void> };
  let previousFonts: PropertyDescriptor | undefined;
  let previousRootFont: string;

  const text = () => document.querySelector<HTMLElement>("[data-rgo-bottom-navigation-label-text]")!;
  const notifyResize = () =>
    act(() => {
      for (const observer of observers) observer.callback([], observer as unknown as ResizeObserver);
    });

  beforeEach(() => {
    availableWidth = 110;
    fontWidthScale = 1;
    translations.labels = {};
    observers = [];
    previousRootFont = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "16px";
    previousFonts = Object.getOwnPropertyDescriptor(document, "fonts");
    fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() });
    Object.defineProperty(document, "fonts", { configurable: true, value: fonts });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        readonly callback: ResizeObserverCallback;
        disconnect = vi.fn();
        observe = vi.fn();
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
          observers.push(this);
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const rootSize = Number.parseFloat(document.documentElement.style.fontSize);
      const width = this.hasAttribute("data-rgo-bottom-navigation-label-measurement")
        ? (this.textContent?.length ?? 0) * rootSize * 0.7 * 0.5 * fontWidthScale
        : availableWidth;
      return { width, height: 14, x: 0, y: 0, top: 0, bottom: 14, left: 0, right: width, toJSON: () => ({}) };
    });
  });

  afterEach(() => {
    document.documentElement.style.fontSize = previousRootFont;
    if (previousFonts) Object.defineProperty(document, "fonts", previousFonts);
    else Reflect.deleteProperty(document, "fonts");
    vi.unstubAllGlobals();
  });

  it("reduces text only as needed, falls back to two lines at the floor, and recovers after widening", () => {
    render(<AppBottomNavigationLabel label="Contacts dashboard" />);
    expect(Number.parseFloat(text().style.fontSize)).toBeCloseTo(11.2);
    expect(text()).toHaveAttribute("data-rgo-label-lines", "1");

    availableWidth = 100;
    notifyResize();
    expect(Number.parseFloat(text().style.fontSize)).toBeGreaterThanOrEqual(11);
    expect(Number.parseFloat(text().style.fontSize)).toBeLessThan(11.2);
    expect(text()).toHaveAttribute("data-rgo-label-lines", "1");

    availableWidth = 80;
    notifyResize();
    expect(text().style.fontSize).toBe("11px");
    expect(text()).toHaveAttribute("data-rgo-label-lines", "2");

    availableWidth = 200;
    notifyResize();
    expect(Number.parseFloat(text().style.fontSize)).toBeCloseTo(11.2);
    expect(text()).toHaveAttribute("data-rgo-label-lines", "1");
  });

  it("refits translated text and follows the root font preference using a stable baseline probe", () => {
    const { rerender } = render(<AppBottomNavigationLabel label="Home" />);
    expect(text()).toHaveAttribute("data-rgo-label-lines", "1");
    availableWidth = 80;
    rerender(<AppBottomNavigationLabel label="Nadzorna ploča kontakata" />);
    expect(text().style.fontSize).toBe("11px");
    expect(text()).toHaveAttribute("data-rgo-label-lines", "2");
    expect(observers[0].disconnect).toHaveBeenCalledOnce();

    document.documentElement.style.fontSize = "20px";
    notifyResize();
    expect(text().style.fontSize).toBe("12px");
    const measurement = document.querySelector("[data-rgo-bottom-navigation-label-measurement]")!;
    expect(measurement).toHaveAttribute("aria-hidden", "true");
    const baselineStyle = getComputedStyle(measurement).fontSize;
    const baselineSize = Number.parseFloat(baselineStyle) * (baselineStyle.endsWith("rem") ? 20 : 1);
    expect(baselineSize).toBeCloseTo(14);
    expect(observers.at(-1)?.observe).toHaveBeenCalledWith(measurement);

    availableWidth = 300;
    notifyResize();
    expect(text().style.fontSize).toBe("14px");
    expect(getComputedStyle(measurement).fontSize).toBe(baselineStyle);
  });

  it("refits after font loading and window resizing and removes every subscription on unmount", async () => {
    const removeWindowListener = vi.spyOn(window, "removeEventListener");
    const removeFontListener = vi.spyOn(fonts, "removeEventListener");
    const { unmount } = render(<AppBottomNavigationLabel label="Contacts dashboard" />);
    fontWidthScale = 1.5;
    act(() => fonts.dispatchEvent(new Event("loadingdone")));
    expect(text().style.fontSize).toBe("11px");
    expect(text()).toHaveAttribute("data-rgo-label-lines", "2");
    availableWidth = 300;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(Number.parseFloat(text().style.fontSize)).toBeCloseTo(11.2);
    await act(async () => {
      await fonts.ready;
    });

    unmount();
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(removeWindowListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeFontListener).toHaveBeenCalledWith("loadingdone", expect.any(Function));
  });

  it("keeps full accessible names and active-link semantics for exceptional unbroken and multiword labels", () => {
    const label = "ExceptionallyLongUnbrokenShortcutLabelThatCannotFitInTwoLines";
    availableWidth = 70;
    translations.labels = {
      "navigation.home": "Home",
      "navigation.settings": label,
      "navigation.contactsDashboard": "Nadzorna ploča kontakata",
    };
    const { container } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <AppBottomNavigation
          items={[
            { Icon: HomeOutlinedIcon, kind: "link", labelKey: "navigation.home", to: "/" },
            { Icon: HomeOutlinedIcon, kind: "link", labelKey: "navigation.settings", to: "/contacts" },
            {
              Icon: HomeOutlinedIcon,
              kind: "link",
              labelKey: "navigation.contactsDashboard",
              labelNamespace: "development-guide",
              to: "/guide",
            },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Nadzorna ploča kontakata" })).toHaveAttribute("href", "/guide");
    const longText = screen.getByRole("link", { name: label }).querySelector("[data-rgo-bottom-navigation-label-text]");
    expect(longText).toHaveAttribute("data-rgo-label-lines", "2");
    expect(longText).toHaveTextContent(label);
    expect(container.querySelectorAll("[data-rgo-bottom-navigation-icon]")).toHaveLength(3);
  });
});
