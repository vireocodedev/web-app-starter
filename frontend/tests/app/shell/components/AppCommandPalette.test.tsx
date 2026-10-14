import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { AppCommandPalette } from "@/app/shell/components/AppCommandPalette";
import type { AppCommandPaletteEntry } from "@/app/shell/types/AppCommandPaletteEntry";

const entries: readonly AppCommandPaletteEntry[] = [
  { context: "", id: "home", label: "Home", to: "/" },
  { context: "Postavke", id: "accessibility", label: "Pristupačnost", to: "/settings/accessibility" },
  { context: "Postavke", id: "navigation", label: "Navigacija", to: "/settings/navigation" },
];

function renderPalette(onNavigate = vi.fn(), locale: "en" | "hr" = "en") {
  const view = render(
    <AppLocalizationProvider initialLocale={locale}>
      <input aria-label="Working note" defaultValue="Keep this note" />
      <textarea aria-label="Working description" defaultValue="Keep this description" />
      <AppCommandPalette entries={entries} onNavigate={onNavigate} />
    </AppLocalizationProvider>,
  );
  return { ...view, onNavigate };
}

async function waitUntilClosed() {
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
}

describe("AppCommandPalette", () => {
  it("keeps translated, accent-insensitive results inside the dialog and provides an empty-results state", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(screen.getByRole("button", { name: "Search pages" }));
    const search = screen.getByRole("combobox", { name: "Search pages" });
    expect(search).toHaveFocus();
    const dialog = screen.getByRole("dialog", { name: "Search pages" });
    expect(dialog).toContainElement(screen.getByRole("listbox", { name: "Pages" }));
    expect(screen.getAllByRole("option")).toHaveLength(3);
    await user.type(search, "POSTAVKE");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    await user.clear(search);
    await user.type(search, "pristupacnost");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Pristupačnost");
    await user.clear(search);
    await user.type(search, "no matching destination");
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("No pages found");
  });

  it("supports keyboard selection and releases the dialog before notifying the router", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn(() => expect(document.querySelector(".MuiModal-root")).toBeNull());
    renderPalette(onNavigate);
    const note = screen.getByRole("textbox", { name: "Working note" });
    note.focus();
    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox", { name: "Search pages" }), "postavke");
    await user.keyboard("{ArrowDown}{Enter}");
    await waitUntilClosed();
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("/settings/navigation");
    expect(note).toHaveFocus();
    expect(note).toHaveValue("Keep this note");
  });

  it("supports pointer selection and resets the search when reopened", async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderPalette();
    const launcher = screen.getByRole("button", { name: "Search pages" });
    await user.click(launcher);
    await user.type(screen.getByRole("combobox", { name: "Search pages" }), "pristupacnost");
    await user.click(screen.getByRole("option"));
    await waitUntilClosed();
    expect(onNavigate).toHaveBeenCalledWith("/settings/accessibility");
    expect(launcher).toHaveFocus();
    await user.click(launcher);
    expect(screen.getByRole("combobox", { name: "Search pages" })).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("restores focus on Escape, the close action, and backdrop dismissal without navigating", async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderPalette();
    const launcher = screen.getByRole("button", { name: "Search pages" });
    await user.click(launcher);
    await user.keyboard("{Escape}");
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
    await user.click(launcher);
    await user.click(screen.getByRole("button", { name: "Close search" }));
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
    await user.click(launcher);
    const container = document.querySelector(".MuiDialog-container")!;
    fireEvent.mouseDown(container);
    fireEvent.click(container);
    await waitUntilClosed();
    expect(launcher).toHaveFocus();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("opens with Cmd+K from a textarea and restores it without changing its contents", async () => {
    const user = userEvent.setup();
    renderPalette();
    const description = screen.getByRole("textbox", { name: "Working description" });
    description.focus();
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("combobox", { name: "Search pages" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitUntilClosed();
    expect(description).toHaveFocus();
    expect(description).toHaveValue("Keep this description");
  });

  it("focuses the launcher when a shortcut opened from the document body is dismissed", async () => {
    const user = userEvent.setup();
    renderPalette();
    expect(document.body).toHaveFocus();
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("combobox", { name: "Search pages" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitUntilClosed();
    expect(screen.getByRole("button", { name: "Search pages" })).toHaveFocus();
  });

  it.each(["disabled", "removed", "unfocusable"])(
    "falls back to the launcher when the previous focus target becomes %s",
    async state => {
      const user = userEvent.setup();
      renderPalette();
      const previousFocus = document.createElement(state === "unfocusable" ? "div" : "input");
      previousFocus.tabIndex = 0;
      document.body.append(previousFocus);
      try {
        previousFocus.focus();
        expect(previousFocus).toHaveFocus();
        await user.keyboard("{Control>}k{/Control}");
        expect(screen.getByRole("combobox", { name: "Search pages" })).toHaveFocus();
        if (state === "disabled") (previousFocus as HTMLInputElement).disabled = true;
        else if (state === "removed") previousFocus.remove();
        else previousFocus.removeAttribute("tabindex");
        await user.keyboard("{Escape}");
        await waitUntilClosed();
        expect(screen.getByRole("button", { name: "Search pages" })).toHaveFocus();
      } finally {
        previousFocus.remove();
      }
    },
  );

  it("ignores handled, repeated, composition, Alt/Shift and contenteditable shortcut events", () => {
    renderPalette();
    for (const overrides of [
      { repeat: true },
      { isComposing: true },
      { altKey: true },
      { shiftKey: true },
      { ctrlKey: false },
    ]) {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "k",
        ...overrides,
      });
      fireEvent(document, event);
      expect(event.defaultPrevented).toBe(false);
      expect(screen.queryByRole("dialog")).toBeNull();
    }
    const handled = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "k" });
    handled.preventDefault();
    fireEvent(document, handled);
    expect(screen.queryByRole("dialog")).toBeNull();
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    const nested = document.createElement("span");
    editor.append(nested);
    document.body.append(editor);
    try {
      fireEvent.keyDown(nested, { ctrlKey: true, key: "k" });
      expect(screen.queryByRole("dialog")).toBeNull();
    } finally {
      editor.remove();
    }
  });

  it.each(["dialog", "menu", "temporary drawer"])(
    "suppresses opening while another %s owns the modal surface",
    surface => {
      renderPalette();
      const overlay = document.createElement("div");
      if (surface === "temporary drawer") overlay.className = "MuiModal-root";
      else overlay.setAttribute("role", surface);
      document.body.append(overlay);
      try {
        const shortcut = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "k" });
        fireEvent(document, shortcut);
        expect(shortcut.defaultPrevented).toBe(false);
        expect(screen.queryByRole("combobox", { name: "Search pages" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Search pages" }));
        expect(screen.queryByRole("combobox", { name: "Search pages" })).toBeNull();
      } finally {
        overlay.remove();
      }
    },
  );

  it("removes its global shortcut listener when the owner unmounts", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    const view = renderPalette();
    const listener = addListener.mock.calls.find(([type]) => type === "keydown")?.[1];
    expect(listener).toBeDefined();
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith("keydown", listener);
    const shortcut = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "k" });
    fireEvent(document, shortcut);
    expect(shortcut.defaultPrevented).toBe(false);
  });

  it("translates the launcher, dialog, instructions, close action and empty state", async () => {
    const user = userEvent.setup();
    renderPalette(vi.fn(), "hr");
    await user.click(screen.getByRole("button", { name: "Pretraži stranice" }));
    expect(screen.getByRole("dialog", { name: "Pretraži stranice" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Zatvori pretraživanje" })).toBeVisible();
    await user.type(screen.getByRole("combobox", { name: "Pretraži stranice" }), "no match");
    expect(screen.getByRole("status")).toHaveTextContent("Nema pronađenih stranica");
  });
});
