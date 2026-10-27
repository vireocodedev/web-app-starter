import { isStorybookThemeMode, type StorybookThemeMode } from "./theme.js";

const storageKey = "rgo.storybook.theme";
const messageType = "rgo-storybook-theme";
const listeners = new Set<() => void>();
let subscriptions = 0;

function initialTheme(): StorybookThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isStorybookThemeMode(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

let selectedTheme = initialTheme();

export function getStorybookThemeMode() {
  return selectedTheme;
}

function sendTheme(target: Window) {
  target.postMessage({ type: messageType, kind: "update", theme: selectedTheme }, window.location.origin);
}

/** The manager owns the selection; updates travel only down the iframe tree. */
export function setStorybookThemeMode(theme: StorybookThemeMode, persist = false) {
  if (persist) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Live theme changes use the iframe bridge even when storage is blocked.
    }
  }
  if (theme === selectedTheme) return;
  selectedTheme = theme;
  listeners.forEach(listener => listener());
  document.querySelectorAll("iframe").forEach(frame => {
    if (frame.contentWindow) sendTheme(frame.contentWindow);
  });
}

function receiveTheme(event: MessageEvent) {
  if (event.origin !== window.location.origin || !event.data || event.data.type !== messageType) return;
  const { kind, theme } = event.data;
  if (kind === "request") {
    const child = Array.from(document.querySelectorAll("iframe")).find(frame => frame.contentWindow === event.source);
    if (child?.contentWindow) sendTheme(child.contentWindow);
  } else if (
    kind === "update" &&
    event.source === window.parent &&
    window.parent !== window &&
    isStorybookThemeMode(theme)
  ) {
    setStorybookThemeMode(theme);
  }
}

export function subscribeStorybookTheme(listener: () => void) {
  listeners.add(listener);
  if (subscriptions++ === 0) {
    window.addEventListener("message", receiveTheme);
    if (window.parent !== window) {
      window.parent.postMessage({ type: messageType, kind: "request" }, window.location.origin);
    }
  }
  return () => {
    listeners.delete(listener);
    if (--subscriptions === 0) window.removeEventListener("message", receiveTheme);
  };
}
