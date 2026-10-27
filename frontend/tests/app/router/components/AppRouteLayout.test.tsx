import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, useNavigate } from "react-router";
import { StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRouteLayout } from "@/app/router/components/AppRouteLayout";
import { RouteScrollContentReady } from "@/app/router/components/RouteScrollRestoration";
import { useRouteScrollReady } from "@/app/router/hooks/useRouteScrollReady";

vi.mock("@/app/localization/hooks/useAppTranslation", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

const originalScrollIntoView = Element.prototype.scrollIntoView;

function FirstPage() {
  const navigate = useNavigate();
  return <button onClick={() => void navigate("/second")}>Next page</button>;
}

function SecondPage() {
  return <p>Second page</p>;
}

function readyRoutes(children: Parameters<typeof createMemoryRouter>[0]) {
  return [
    {
      Component: AppRouteLayout,
      children: [{ Component: RouteScrollContentReady, children }],
    },
  ];
}

async function advanceAnimationFrame() {
  await act(async () => {
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  });
}

describe("AppRouteLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
    window.history.replaceState(null, "", "/");
  });

  it("resets window scroll when navigation creates a new location", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const router = createMemoryRouter(
      readyRoutes([
        { Component: FirstPage, path: "/first" },
        { Component: SecondPage, path: "/second" },
      ]),
      { initialEntries: ["/first"] },
    );

    render(<RouterProvider router={router} />);
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 0,
      }),
    );
  });

  it("shows a scroll-to-top action only for an opted-in route", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(400);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const router = createMemoryRouter(
      readyRoutes([
        {
          Component: SecondPage,
          handle: {
            resolveBreadcrumbs: () => [],
            resolveTitle: () => "Second page",
            scrollToTop: true,
          },
          path: "/enabled",
        },
      ]),
      { initialEntries: ["/enabled"] },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(await screen.findByRole("button", { name: "navigation.scrollToTop" }));
    expect(scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });
  });

  it("records the position produced by the explicit scroll-to-top action", async () => {
    let scrollTop = 500;
    vi.spyOn(window, "scrollX", "get").mockReturnValue(0);
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollTop);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation((optionsOrX?: number | ScrollToOptions) => {
      if (typeof optionsOrX === "object") {
        scrollTop = optionsOrX.top ?? scrollTop;
        fireEvent.scroll(window);
      }
    });
    const router = createMemoryRouter(
      readyRoutes([
        {
          Component: SecondPage,
          handle: {
            resolveBreadcrumbs: () => [],
            resolveTitle: () => "Enabled page",
            scrollToTop: true,
          },
          path: "/enabled",
        },
        { Component: SecondPage, path: "/other" },
      ]),
      { initialEntries: ["/enabled"] },
    );
    window.history.replaceState(null, "", "/enabled");
    render(<RouterProvider router={router} />);

    fireEvent.scroll(window);
    fireEvent.click(await screen.findByRole("button", { name: "navigation.scrollToTop" }));
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));

    await router.navigate("/other");
    await screen.findByText("Second page");
    scrollTo.mockClear();
    await router.navigate(-1);
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 0,
      }),
    );
  });

  it("keeps the scroll-to-top action off without route metadata", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(400);
    const router = createMemoryRouter(readyRoutes([{ Component: SecondPage, path: "/default" }]), {
      initialEntries: ["/default"],
    });

    render(<RouterProvider router={router} />);

    expect(screen.queryByRole("button", { name: "navigation.scrollToTop" })).not.toBeInTheDocument();
  });

  it("preserves scroll and focus for push and replace query updates", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    function QueryPage() {
      const navigate = useNavigate();
      return (
        <>
          <input aria-label="Filter" />
          <button onClick={() => void navigate("?filter=one#unchanged")}>Push query</button>
          <button onClick={() => void navigate("?filter=two#unchanged", { replace: true })}>Replace query</button>
        </>
      );
    }

    const router = createMemoryRouter(readyRoutes([{ Component: QueryPage, path: "/items" }]), {
      initialEntries: ["/items#unchanged"],
    });
    render(<RouterProvider router={router} />);
    const input = screen.getByRole("textbox", { name: "Filter" });
    input.focus();
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Push query" }));
    await waitFor(() => expect(router.state.location.search).toBe("?filter=one"));
    expect(input).toHaveFocus();
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Replace query" }));
    await waitFor(() => expect(router.state.location.search).toBe("?filter=two"));
    expect(input).toHaveFocus();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("restores distinct recorded positions during Back and Forward", async () => {
    let scrollTop = 0;
    vi.spyOn(window, "scrollX", "get").mockReturnValue(0);
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollTop);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation((optionsOrX?: number | ScrollToOptions) => {
      if (typeof optionsOrX === "object") {
        scrollTop = optionsOrX.top ?? scrollTop;
      }
    });
    const router = createMemoryRouter(
      readyRoutes([
        { Component: FirstPage, path: "/first" },
        { Component: SecondPage, path: "/second" },
      ]),
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    scrollTop = 420;
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Second page");
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 0 }));
    scrollTop = 760;
    fireEvent.scroll(window);
    scrollTo.mockClear();

    await router.navigate(-1);
    await screen.findByRole("button", { name: "Next page" });
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 420,
      }),
    );

    scrollTo.mockClear();
    await router.navigate(1);
    await screen.findByText("Second page");
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 760,
      }),
    );
  });

  it("resumes position tracking after a click that does not navigate", async () => {
    let scrollTop = 0;
    vi.spyOn(window, "scrollX", "get").mockReturnValue(0);
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollTop);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation((optionsOrX?: number | ScrollToOptions) => {
      if (typeof optionsOrX === "object") {
        scrollTop = optionsOrX.top ?? scrollTop;
      }
    });

    function InteractiveSecondPage() {
      return <button onClick={() => undefined}>Toggle details</button>;
    }

    const router = createMemoryRouter(
      readyRoutes([
        { Component: FirstPage, path: "/first" },
        { Component: InteractiveSecondPage, path: "/second" },
      ]),
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    scrollTop = 140;
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByRole("button", { name: "Toggle details" });
    window.history.replaceState(null, "", "/second");
    fireEvent.click(screen.getByRole("button", { name: "Toggle details" }));
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
    scrollTop = 680;
    fireEvent.scroll(window);

    await router.navigate(-1);
    await screen.findByRole("button", { name: "Next page" });
    scrollTo.mockClear();
    await router.navigate(1);
    await screen.findByRole("button", { name: "Toggle details" });
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 680,
      }),
    );
  });

  it("waits for destination readiness and applies a fragment only once", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    function DeferredRoute() {
      const [ready, setReady] = useState(false);
      return ready ? <Outlet /> : <button onClick={() => setReady(true)}>Reveal route</button>;
    }

    function FragmentPage() {
      return <h2 id="target">Target</h2>;
    }

    const router = createMemoryRouter(
      [
        {
          Component: AppRouteLayout,
          children: [
            { Component: FirstPage, path: "/first" },
            {
              Component: DeferredRoute,
              path: "/deferred",
              children: [
                {
                  Component: RouteScrollContentReady,
                  children: [{ Component: FragmentPage, index: true }],
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    await router.navigate("/deferred#target");
    expect(await screen.findByRole("button", { name: "Reveal route" })).toBeVisible();
    expect(scrollIntoView).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reveal route" }));
    await screen.findByRole("heading", { name: "Target" });
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      }),
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("heading", { name: "Target" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("waits for a delayed leaf and does not replay its fragment after a retry", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    function DeferredLeaf() {
      const [ready, setReady] = useState(false);
      useRouteScrollReady(ready);
      return (
        <>
          <button onClick={() => setReady(value => !value)}>{ready ? "Reload article" : "Reveal article"}</button>
          {ready ? <h2 id="target">Article target</h2> : <p>Loading article</p>}
        </>
      );
    }

    const router = createMemoryRouter(readyRoutes([{ Component: DeferredLeaf, path: "/article" }]), {
      initialEntries: ["/article#target"],
    });
    render(<RouterProvider router={router} />);

    await advanceAnimationFrame();
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Reveal article" }));
    await screen.findByRole("heading", { name: "Article target" });
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Reload article" }));
    await advanceAnimationFrame();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reveal article" }));
    await screen.findByRole("heading", { name: "Article target" });
    await advanceAnimationFrame();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("preserves a saved position through a pending leaf clamp and another visit", async () => {
    let scrollTop = 0;
    let initiallyReady = true;
    vi.spyOn(window, "scrollX", "get").mockReturnValue(0);
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollTop);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation((optionsOrX?: number | ScrollToOptions) => {
      if (typeof optionsOrX === "object") scrollTop = optionsOrX.top ?? scrollTop;
    });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    function ReadingPage() {
      const [ready, setReady] = useState(initiallyReady);
      useRouteScrollReady(ready);
      return ready ? (
        <h2 id="target">Reading target</h2>
      ) : (
        <button onClick={() => setReady(true)}>Reveal reading</button>
      );
    }

    const router = createMemoryRouter(
      readyRoutes([
        { Component: ReadingPage, path: "/reading" },
        { Component: SecondPage, path: "/other" },
      ]),
      { initialEntries: ["/reading#target"] },
    );
    window.history.replaceState(null, "", "/reading#target");
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    scrollTop = 420;
    fireEvent.scroll(window);
    initiallyReady = false;

    await act(async () => router.navigate("/other"));
    await screen.findByText("Second page");
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 0 }));
    scrollTo.mockClear();
    scrollIntoView.mockClear();

    await act(async () => router.navigate(-1));
    await screen.findByRole("button", { name: "Reveal reading" });
    await advanceAnimationFrame();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    // A shorter loading placeholder must not replace the original entry's reading position.
    scrollTop = 0;
    fireEvent.scroll(window);
    await act(async () => router.navigate("/other"));
    await screen.findByText("Second page");
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 0 }));
    scrollTo.mockClear();

    await act(async () => router.navigate(-1));
    await screen.findByRole("button", { name: "Reveal reading" });
    await advanceAnimationFrame();
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reveal reading" }));
    await screen.findByRole("heading", { name: "Reading target" });
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 420 }));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("cancels a pending leaf fragment before another page renders the same target", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    function DeferredLeaf() {
      useRouteScrollReady(false);
      return <p>Waiting for article</p>;
    }

    function LaterPage() {
      return <h2 id="target">Other article target</h2>;
    }

    const router = createMemoryRouter(
      readyRoutes([
        { Component: DeferredLeaf, path: "/deferred" },
        { Component: LaterPage, path: "/later" },
      ]),
      { initialEntries: ["/deferred#target"] },
    );
    render(<RouterProvider router={router} />);
    await screen.findByText("Waiting for article");
    await advanceAnimationFrame();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await act(async () => router.navigate("/later"));
    await screen.findByRole("heading", { name: "Other article target" });
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", left: 0, top: 0 }));
    await advanceAnimationFrame();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("applies an initial fragment once across a Strict Mode remount", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    function FragmentPage() {
      return <h2 id="target">Strict target</h2>;
    }

    const router = createMemoryRouter(readyRoutes([{ Component: FragmentPage, path: "/page" }]), {
      initialEntries: ["/page#target"],
    });
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );

    await screen.findByRole("heading", { name: "Strict target" });
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      }),
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("uses the documented fallback for missing and malformed fragments", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    function SamePathPage() {
      const navigate = useNavigate();
      return <button onClick={() => void navigate("#missing")}>Missing target</button>;
    }

    const router = createMemoryRouter(
      readyRoutes([
        { Component: SamePathPage, path: "/first" },
        { Component: SecondPage, path: "/second" },
      ]),
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Missing target" }));
    await waitFor(() => expect(router.state.location.hash).toBe("#missing"));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();

    await router.navigate("/second#%E0%A4%A");
    await screen.findByText("Second page");
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 0,
      }),
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("invalidates a deferred fragment when another navigation supersedes it", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    function DeferredRoute() {
      return <p>Waiting for content</p>;
    }

    function LaterPage() {
      return <h2 id="target">Later page</h2>;
    }

    const router = createMemoryRouter(
      [
        {
          Component: AppRouteLayout,
          children: [
            { Component: FirstPage, path: "/first" },
            { Component: DeferredRoute, path: "/deferred" },
            {
              Component: RouteScrollContentReady,
              children: [{ Component: LaterPage, path: "/later" }],
            },
          ],
        },
      ],
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    await router.navigate("/deferred#target");
    await screen.findByText("Waiting for content");
    await router.navigate("/later");
    await screen.findByRole("heading", { name: "Later page" });
    await waitFor(() => expect(scrollTo).toHaveBeenCalled());
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("waits for a lazy route module before applying its fragment", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    let releaseLazyRoute: (() => void) | undefined;
    const lazyRouteReady = new Promise<void>(resolve => {
      releaseLazyRoute = resolve;
    });

    function LazyPage() {
      return <h2 id="target">Lazy target</h2>;
    }

    const router = createMemoryRouter(
      readyRoutes([
        { Component: FirstPage, path: "/first" },
        {
          lazy: async () => {
            await lazyRouteReady;
            return { Component: LazyPage };
          },
          path: "/lazy",
        },
      ]),
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    const navigation = router.navigate("/lazy#target");
    expect(scrollIntoView).not.toHaveBeenCalled();
    releaseLazyRoute?.();
    await navigation;
    await screen.findByRole("heading", { name: "Lazy target" });
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      }),
    );
  });

  it("leaves a native entry with a reused key to browser restoration", async () => {
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      value: "auto",
      writable: true,
    });
    let scrollTop = 320;
    vi.spyOn(window, "scrollX", "get").mockReturnValue(0);
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollTop);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation((optionsOrX?: number | ScrollToOptions) => {
      if (typeof optionsOrX === "object") {
        scrollTop = optionsOrX.top ?? scrollTop;
      }
    });
    const router = createMemoryRouter(
      readyRoutes([
        { Component: FirstPage, path: "/first" },
        { Component: SecondPage, path: "/second" },
      ]),
      { initialEntries: ["/first"] },
    );
    render(<RouterProvider router={router} />);

    window.history.replaceState(null, "", "/native#target");
    window.dispatchEvent(new Event("hashchange"));
    expect(window.history.scrollRestoration).toBe("auto");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Second page");
    scrollTo.mockClear();

    await router.navigate(-1);
    await screen.findByRole("button", { name: "Next page" });
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
        top: 0,
      }),
    );
  });

  it("owns browser restoration only while mounted and across bfcache pageshow", () => {
    const cancelAnimationFrame = vi.spyOn(window, "cancelAnimationFrame");
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      value: "auto",
      writable: true,
    });
    const router = createMemoryRouter(readyRoutes([{ Component: SecondPage, path: "/page" }]), {
      initialEntries: ["/page#missing"],
    });
    const view = render(<RouterProvider router={router} />);
    expect(window.history.scrollRestoration).toBe("manual");

    window.dispatchEvent(new Event("pagehide"));
    expect(window.history.scrollRestoration).toBe("auto");
    expect(cancelAnimationFrame).toHaveBeenCalled();
    const pageShow = new Event("pageshow");
    Object.defineProperty(pageShow, "persisted", { value: true });
    window.dispatchEvent(pageShow);
    expect(window.history.scrollRestoration).toBe("manual");

    view.unmount();
    expect(window.history.scrollRestoration).toBe("auto");
  });
});
