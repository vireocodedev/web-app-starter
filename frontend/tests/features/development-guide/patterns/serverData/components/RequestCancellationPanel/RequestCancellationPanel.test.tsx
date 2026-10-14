import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CancellationSearchPreview } from "@/features/development-guide/patterns/serverData/components/RequestCancellationPanel/CancellationSearchPreview";
import { ManualCancellationPreview } from "@/features/development-guide/patterns/serverData/components/RequestCancellationPanel/ManualCancellationPreview";
import type { ServerDataExampleApi } from "@/features/development-guide/patterns/serverData/api/serverData.api";
import { ExampleGallery } from "@/features/development-guide/patterns/gallery";

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

function createPendingApi() {
  const signals: AbortSignal[] = [];
  const api: ServerDataExampleApi = {
    findAll: vi.fn((_filters, options) => {
      const signal = options?.signal as AbortSignal;
      signals.push(signal);

      return new Promise<never>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true });
      });
    }),
    updateStatus: vi.fn(),
  };

  return { api, signals };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe("CancellationSearchPreview", () => {
  it("reloads one gallery request and its local search without disturbing its sibling", async () => {
    const first = createPendingApi();
    const sibling = createPendingApi();
    render(
      <ExampleGallery
        resources={{
          codeLabels: { hide: "Hide code", language: "tsx", show: "Show code" },
          contents: { label: "Request examples", title: "Requests" },
          examples: [first, sibling].map(({ api }, index) => ({
            code: "<CancellationSearchPreview />",
            description: "A cancellable search request",
            id: `request-${index}`,
            preview: <CancellationSearchPreview api={api} />,
            sourcePath:
              "src/features/development-guide/patterns/serverData/components/RequestCancellationPanel/CancellationSearchPreview.tsx",
            title: `Request ${index}`,
          })),
        }}
      />,
    );

    await waitFor(() => {
      expect(first.signals).toHaveLength(1);
      expect(sibling.signals).toHaveLength(1);
    });
    const inputs = screen.getAllByLabelText("serverDataExamples.cancellation.automatic.label");
    fireEvent.change(inputs[0], { target: { value: "atlas" } });
    fireEvent.change(inputs[1], { target: { value: "beacon" } });
    await waitFor(() => {
      expect(first.signals).toHaveLength(2);
      expect(sibling.signals).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "exampleGallery.reload" })[0]);

    await waitFor(() => expect(first.signals).toHaveLength(3));
    expect(first.signals[1].aborted).toBe(true);
    expect(first.signals[2].aborted).toBe(false);
    expect(sibling.signals).toHaveLength(2);
    expect(sibling.signals[1].aborted).toBe(false);
    const reloadedInputs = screen.getAllByLabelText("serverDataExamples.cancellation.automatic.label");
    expect(reloadedInputs[0]).toHaveValue("");
    expect(reloadedInputs[1]).toHaveValue("beacon");
  });

  it("aborts the obsolete request when search changes its query key", async () => {
    const { api, signals } = createPendingApi();
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CancellationSearchPreview api={api} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(signals).toHaveLength(1));
    fireEvent.change(screen.getByLabelText("serverDataExamples.cancellation.automatic.label"), {
      target: { value: "atlas" },
    });

    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it("cancels an explicit request and allows another request to start", async () => {
    const { api, signals } = createPendingApi();
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ManualCancellationPreview api={api} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(signals).toHaveLength(1));
    fireEvent.click(
      screen.getByRole("button", {
        name: "serverDataExamples.cancellation.manual.action",
      }),
    );

    await screen.findByText("serverDataExamples.cancellation.manual.cancelled");
    expect(signals[0]?.aborted).toBe(true);

    fireEvent.click(
      screen.getByRole("button", {
        name: "serverDataExamples.cancellation.manual.start",
      }),
    );
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[1]?.aborted).toBe(false);
  });

  it("aborts the request when its last observer unmounts", async () => {
    const { api, signals } = createPendingApi();
    const queryClient = createQueryClient();
    const result = render(
      <QueryClientProvider client={queryClient}>
        <CancellationSearchPreview api={api} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(signals).toHaveLength(1));
    result.unmount();

    expect(signals[0]?.aborted).toBe(true);
  });
});
