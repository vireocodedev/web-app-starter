import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cleanups: (() => void)[] = [];
const parentDescriptor = Object.getOwnPropertyDescriptor(window, "parent")!;
const originalUrl = window.location.href;
const storageKey = "rgo.storybook.theme";
const messageType = "rgo-storybook-theme";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.removeItem(storageKey);
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup());
  Object.defineProperty(window, "parent", parentDescriptor);
  document.querySelectorAll("iframe").forEach(frame => frame.remove());
  window.history.replaceState(null, "", originalUrl);
  window.localStorage.removeItem(storageKey);
});

describe("Storybook theme synchronization", () => {
  it("restores the saved Storybook preference", async () => {
    window.localStorage.setItem(storageKey, "soft-dark");
    const { getStorybookThemeMode } = await import("../../../.storybook/themeSync");
    expect(getStorybookThemeMode()).toBe("soft-dark");
  });

  it("rejects unsupported stored values and follows System by default", async () => {
    window.localStorage.setItem(storageKey, "unsupported");
    const { getStorybookThemeMode } = await import("../../../.storybook/themeSync");
    expect(getStorybookThemeMode()).toBe("system");
  });

  it("responds to a newly mounted child with the current theme, including when storage is blocked", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    const { subscribeStorybookTheme, setStorybookThemeMode, getStorybookThemeMode } =
      await import("../../../.storybook/themeSync");
    cleanups.push(subscribeStorybookTheme(vi.fn()));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    setStorybookThemeMode("dark", true);
    expect(getStorybookThemeMode()).toBe("dark");
    post.mockClear();
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        source: frame.contentWindow,
        data: { type: messageType, kind: "request" },
      }),
    );
    expect(post).toHaveBeenCalledWith({ type: messageType, kind: "update", theme: "dark" }, window.location.origin);
  });

  it("accepts only valid same-origin parent updates and forwards them to descendants", async () => {
    const parent = document.createElement("iframe");
    const child = document.createElement("iframe");
    document.body.append(parent, child);
    Object.defineProperty(window, "parent", { configurable: true, value: parent.contentWindow });
    const childPost = vi.spyOn(child.contentWindow!, "postMessage");
    const changed = vi.fn();
    const { subscribeStorybookTheme, getStorybookThemeMode } = await import("../../../.storybook/themeSync");
    cleanups.push(subscribeStorybookTheme(changed));
    const update = (origin: string, source: Window | null, theme: string) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          origin,
          source,
          data: { type: messageType, kind: "update", theme },
        }),
      );
    update("https://untrusted.invalid", parent.contentWindow, "dark");
    update(window.location.origin, child.contentWindow, "dark");
    update(window.location.origin, parent.contentWindow, "unsupported");
    expect(getStorybookThemeMode()).toBe("system");
    expect(changed).not.toHaveBeenCalled();
    update(window.location.origin, parent.contentWindow, "soft-dark");
    expect(getStorybookThemeMode()).toBe("soft-dark");
    expect(childPost).toHaveBeenCalledWith(
      { type: messageType, kind: "update", theme: "soft-dark" },
      window.location.origin,
    );
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it("releases the message listener when its last consumer unmounts", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    const { subscribeStorybookTheme } = await import("../../../.storybook/themeSync");
    const unsubscribe = subscribeStorybookTheme(vi.fn());
    unsubscribe();
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        source: frame.contentWindow,
        data: { type: messageType, kind: "request" },
      }),
    );
    expect(post).not.toHaveBeenCalled();
  });
});
