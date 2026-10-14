import type { ComponentType, PropsWithChildren, ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { AppRuntimeProvider, type AppRuntimeContextValue } from "@/app/bootstrap/runtime/AppRuntimeProvider";

type TestWrapper = ComponentType<PropsWithChildren>;

type RenderAppOptions = Omit<RenderOptions, "wrapper"> & {
  initialEntries?: string[];
  provider?: TestWrapper;
  queryClient?: QueryClient;
  runtime?: AppRuntimeContextValue;
  withRouter?: boolean;
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

/**
 * Renders one application boundary with a fresh query cache and optional
 * application runtime. Use provider only for additional test-specific seams.
 */
export function renderApp(
  ui: ReactElement,
  {
    initialEntries = ["/"],
    provider: Provider,
    runtime,
    queryClient = runtime?.queryClient ?? createTestQueryClient(),
    withRouter = true,
    ...renderOptions
  }: RenderAppOptions = {},
) {
  function TestProviders({ children }: PropsWithChildren) {
    const routedContent = withRouter ? (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ) : (
      children
    );
    const providerContent = Provider ? <Provider>{routedContent}</Provider> : routedContent;
    const queryContent = <QueryClientProvider client={queryClient}>{providerContent}</QueryClientProvider>;

    return runtime ? <AppRuntimeProvider runtime={runtime}>{queryContent}</AppRuntimeProvider> : queryContent;
  }

  return {
    ...render(ui, { wrapper: TestProviders, ...renderOptions }),
    queryClient,
  };
}
