import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as architecture from "../../../docs/storybook/architecture/ArchitectureReference/catalog/architectureArticles";
import { ReferenceReader } from "../../../docs/storybook/shared/documentation/ReferenceReader";

describe("Storybook reference reader", () => {
  it("searches source metadata and selects a complete lazy article inside the preview", async () => {
    render(<ReferenceReader />);
    expect(screen.getByRole("status")).toHaveTextContent("Matching articles: 158 of 158");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search reference articles" }), {
      target: { value: "one transaction" },
    });
    const select = screen.getByRole("combobox", { name: "Read article" });
    expect(select.querySelectorAll("option").length).toBeGreaterThan(1);
    fireEvent.change(select, { target: { value: "/handbook/backend/application-services/transactional-commands" } });
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "One transaction for one complete business command" })).toBeVisible(),
    );
    expect(screen.getByRole("textbox", { name: "Preview URL" })).toHaveValue(
      "/handbook/backend/application-services/transactional-commands",
    );
    expect(screen.getByRole("navigation", { name: "Article contents" })).toBeVisible();
  });

  it("follows an architecture-to-handbook link without entering an application route", async () => {
    render(
      <ReferenceReader kind="architecture" initialPath="/architecture/tests-mocks-stories-and-architecture-checks" />,
    );
    const link = await screen.findByRole("link", { name: "Architecture invariants and checks" });
    expect(link).toHaveAttribute("href", "/handbook/quality/test-design/architecture-invariants-and-checks");
    fireEvent.click(link);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Architecture invariants and checks" })).toBeVisible(),
    );
    expect(screen.getByRole("textbox", { name: "Preview URL" })).toHaveValue(
      "/handbook/quality/test-design/architecture-invariants-and-checks",
    );
  });
});

describe("reference reader fragment ownership", () => {
  const scrollDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
  afterEach(() => {
    if (scrollDescriptor) Object.defineProperty(Element.prototype, "scrollIntoView", scrollDescriptor);
    else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    vi.restoreAllMocks();
  });

  function scrollingFixture() {
    const scroll = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scroll });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => frames.push(callback));
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    return { scroll, frames, cancel };
  }

  it("scrolls a same-article route fragment after the ready body renders", async () => {
    const { scroll, frames } = scrollingFixture();
    render(<ReferenceReader kind="architecture" initialPath="/architecture/router-and-shell-responsibilities" />);
    const link = await screen.findByRole("link", { name: "window scroll policy" });
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(link);
    await waitFor(() => expect(frames).toHaveLength(1));
    act(() => frames[0]!(0));
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "auto" });
    expect(scroll.mock.contexts[0]).toBe(screen.getByRole("heading", { name: "Window scroll policy" }));
    expect(screen.getByRole("textbox", { name: "Preview URL" })).toHaveValue(
      "/architecture/router-and-shell-responsibilities#window-scroll-policy",
    );
  });

  it("waits for a different article's lazy body before scrolling its fragment", async () => {
    const targetMarkdown = await architecture.loadArchitectureMarkdown("router-and-shell-responsibilities", "en");
    let accept!: (markdown: string) => void;
    const delayedBody = new Promise<string>(resolve => {
      accept = resolve;
    });
    vi.spyOn(architecture, "loadArchitectureMarkdown")
      .mockResolvedValueOnce(
        "# Source article\n\n[Read scroll policy](router-and-shell-responsibilities.md#window-scroll-policy)",
      )
      .mockReturnValueOnce(delayedBody);
    const { scroll, frames } = scrollingFixture();
    render(<ReferenceReader kind="architecture" initialPath="/architecture/source-map-and-ownership" />);
    fireEvent.click(await screen.findByRole("link", { name: "Read scroll policy" }));
    expect(screen.getByText("Loading selected article…")).toBeVisible();
    expect(frames).toHaveLength(0);
    expect(scroll).not.toHaveBeenCalled();
    await act(async () => {
      accept(targetMarkdown);
    });
    await screen.findByRole("heading", { name: "Window scroll policy" });
    await waitFor(() => expect(frames).toHaveLength(1));
    act(() => frames[0]!(0));
    expect(scroll.mock.contexts[0]).toBe(screen.getByRole("heading", { name: "Window scroll policy" }));
  });

  it("cancels an obsolete article's queued frame after navigating away", async () => {
    const { scroll, frames, cancel } = scrollingFixture();
    render(
      <ReferenceReader
        kind="architecture"
        initialPath="/architecture/router-and-shell-responsibilities#window-scroll-policy"
      />,
    );
    await screen.findByRole("heading", { name: "Window scroll policy" });
    await waitFor(() => expect(frames).toHaveLength(1));
    fireEvent.click(screen.getByRole("link", { name: "Architecture (15)" }));
    expect(cancel).toHaveBeenCalledWith(1);
    act(() => frames[0]!(0));
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox", { name: "Read article" }), {
      target: { value: "/architecture/router-and-shell-responsibilities" },
    });
    await screen.findByRole("heading", { name: "Window scroll policy" });
    expect(frames).toHaveLength(1);
  });

  it("keeps an article readable when its fragment contains invalid URI encoding", async () => {
    const { scroll, frames } = scrollingFixture();
    render(
      <ReferenceReader kind="architecture" initialPath="/architecture/router-and-shell-responsibilities#%E0%A4%A" />,
    );
    expect(await screen.findByRole("heading", { name: "Window scroll policy" })).toBeVisible();
    expect(frames).toHaveLength(0);
    expect(scroll).not.toHaveBeenCalled();
  });
});
