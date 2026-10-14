import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NestedRoutesPanel } from "@/features/development-guide/patterns/routingAndUrlState/components/NestedRoutesPanel/NestedRoutesPanel";
import { RouteParametersAndBreadcrumbsPanel } from "@/features/development-guide/patterns/routingAndUrlState/components/RouteParametersAndBreadcrumbsPanel/RouteParametersAndBreadcrumbsPanel";
import { RouteRecoveryBoundary } from "@/features/development-guide/patterns/routingAndUrlState/components/RouteRecoveryPanel/RouteRecoveryBoundary";
import { RouteRecoveryPanel } from "@/features/development-guide/patterns/routingAndUrlState/components/RouteRecoveryPanel/RouteRecoveryPanel";
import { SearchParametersPanel } from "@/features/development-guide/patterns/routingAndUrlState/components/SearchParametersPanel/SearchParametersPanel";

const galleryState = vi.hoisted(() => ({ exampleIndex: 0 }));

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: unknown }[] } }) =>
    resources.examples[galleryState.exampleIndex]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key),
  }),
}));

function renderRoute(
  path: string,
  Component: () => React.ReactNode,
  routePath = "/patterns/*",
  ErrorBoundary?: () => React.ReactNode,
) {
  const router = createMemoryRouter([{ Component, ErrorBoundary, path: routePath }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("Routing and URL state patterns", () => {
  beforeEach(() => {
    galleryState.exampleIndex = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("replaces filters and resets the page atomically while preserving unrelated parameters", () => {
    const router = renderRoute("/patterns?q=atlas&page=3&status=active&tag=one&tag=two", SearchParametersPanel);

    fireEvent.change(screen.getByLabelText("routingExamples.searchParams.filters.queryLabel"), {
      target: { value: "harbor" },
    });

    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("q")).toBe("harbor");
    expect(params.has("page")).toBe(false);
    expect(params.get("status")).toBe("active");
    expect(params.getAll("tag")).toEqual(["one", "two"]);
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("pushes page choices and restores the prior value with Back", async () => {
    galleryState.exampleIndex = 1;
    const router = renderRoute("/patterns?tag=one&tag=two", SearchParametersPanel);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(router.state.historyAction).toBe("PUSH");
    expect(new URLSearchParams(router.state.location.search).get("page")).toBe("2");
    expect(new URLSearchParams(router.state.location.search).getAll("tag")).toEqual(["one", "two"]);

    await act(() => router.navigate(-1));
    expect(screen.getByText(/"page":1/)).toBeVisible();
    expect(router.state.location.search).toBe("?tag=one&tag=two");
  });

  it("falls back safely when the page search parameter is malformed", () => {
    galleryState.exampleIndex = 1;
    renderRoute("/patterns?page=not-a-page", SearchParametersPanel);

    expect(screen.getByText(/"page":1/)).not.toBeNull();
  });

  it("reads a dynamic project parameter and navigates to another identity", async () => {
    const router = renderRoute("/patterns/harbor", RouteParametersAndBreadcrumbsPanel, "/patterns/:projectId");

    expect(screen.getByText(/"projectId":"harbor"/)).not.toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "summit" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/summit",
      ),
    );
  });

  it("renders nested child content and changes descendants", async () => {
    const router = renderRoute(
      "/dev-guide/patterns/routing-and-url-state/nested-routes/workspace/overview",
      NestedRoutesPanel,
      "/dev-guide/patterns/routing-and-url-state/nested-routes/*",
    );

    expect(screen.getByText("routingExamples.nested.preview.overviewDescription")).not.toBeNull();
    fireEvent.click(
      screen.getByRole("link", {
        name: "routingExamples.nested.preview.activity",
      }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/dev-guide/patterns/routing-and-url-state/nested-routes/workspace/activity",
      ),
    );
  });

  it("contains a child route failure and recovers to the safe route", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = renderRoute(
      "/dev-guide/patterns/routing-and-url-state/route-level-recovery/summary",
      RouteRecoveryPanel,
      "/dev-guide/patterns/routing-and-url-state/route-level-recovery/*",
      RouteRecoveryBoundary,
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "routingExamples.recovery.preview.break",
      }),
    );
    expect(await screen.findByText(/routingExamples.recovery.preview.failed/)).not.toBeNull();

    fireEvent.click(
      screen.getByRole("link", {
        name: "routingExamples.recovery.preview.recover",
      }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/dev-guide/patterns/routing-and-url-state/route-level-recovery/summary",
      ),
    );
  });
});
