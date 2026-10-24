import { TextField, Typography } from "@mui/material";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, Outlet, Route, RouterProvider, createRoutesFromElements } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMemo, type PropsWithChildren } from "react";

import { createAppAxios } from "@/app/data/http/createAppAxios";
import { AppRouteLayout } from "@/app/router/components/AppRouteLayout";
import type { AppRouteTranslations } from "@/app/router/types/AppRoute";
import { server } from "@test/server";
import { createAuthHandlers, mockAuthSessionStore, mockAuthUser, mockLoginCredentials } from "@mocks/auth";
import { appAuthSpringSessionEndpoints, serializeSpringSessionUser } from "@/app/auth/api/appAuth.api.springSession";
import { AppAuthQueryKey } from "@/app/auth/api/appAuth.querykeys";
import type { AppAuthLoginAssistance } from "@/app/auth/types/AppAuthLoginAssistance";
import { AppAuthGate } from "@/app/auth/components/AppAuthGate";
import { AppAuthActions } from "@/app/auth/components/AppAuthActions";
import { AppAuthProvider } from "@/app/auth/components/AppAuthProvider";
import { LoginPage } from "@/pages/LoginPage";
import { muiLocaleOptions } from "@/app/localization/localeSetup";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { resolveInitialLocale } from "@/app/localization/preferences/localePreference";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { RouteScrollContentReady } from "@/app/router/components/RouteScrollRestoration";
import { AppRenderErrorBoundary } from "@/app/bootstrap/failure/AppRenderErrorBoundary";
import { useAppAuth } from "@/app/auth/hooks/useAppAuth";

const apiBaseUrl = "https://api.example.invalid";
const originalScrollIntoView = Element.prototype.scrollIntoView;

function LocalizedThemeProvider({ children }: PropsWithChildren) {
  const { direction, locale } = useAppLocalization();
  const localeOptions = useMemo(() => muiLocaleOptions[locale], [locale]);

  return (
    <AppThemeProvider direction={direction} localeOptions={localeOptions}>
      {children}
    </AppThemeProvider>
  );
}

function LocaleSwitch() {
  const { setLocale } = useAppLocalization();
  return (
    <>
      <button onClick={() => setLocale("hr")} type="button">
        Use Croatian
      </button>
      <button onClick={() => setLocale("en")} type="button">
        Use English
      </button>
    </>
  );
}

function ProtectedScreen() {
  return (
    <main>
      <Typography component="h1">Protected screen</Typography>
      <Typography component="h2" id="protected-details">
        Protected details
      </Typography>
      <AppAuthActions />
      <Outlet />
    </main>
  );
}

function ProtectedChildScreen() {
  const auth = useAppAuth();
  const identityData = useQuery({
    queryFn: async () => ({ owner: auth.user?.id ?? "anonymous" }),
    queryKey: ["identity-probe"],
    staleTime: Number.POSITIVE_INFINITY,
  });

  return (
    <>
      <Typography>Protected child screen</Typography>
      <output aria-label="Identity-bound data">
        {auth.user?.id}:{identityData.data?.owner ?? "loading"}
      </output>
      <TextField label="Protected draft" />
    </>
  );
}

function renderAuthFlow({
  initialEntry = "/protected/child?view=private",
  loginAssistance,
  localeSwitcher = false,
  sessionDelay,
  sessionResponse,
}: Readonly<{
  initialEntry?: string;
  loginAssistance?: AppAuthLoginAssistance;
  localeSwitcher?: boolean;
  sessionDelay?: Promise<void>;
  sessionResponse?: () => Response | Promise<Response>;
}> = {}) {
  server.use(...createAuthHandlers(apiBaseUrl));
  if (sessionDelay) {
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, async () => {
        await sessionDelay;
        return HttpResponse.json(serializeSpringSessionUser(mockAuthUser));
      }),
    );
  }
  if (sessionResponse) {
    server.use(http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, sessionResponse));
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const runtime = createAppAuthRuntime({
    http: createAppAxios({
      VITE_API_BASE_URL: apiBaseUrl,
      VITE_APP_ENV: "test",
      VITE_API_MODE: "http",
      VITE_API_WITH_CREDENTIALS: true,
      VITE_REQUEST_TIMEOUT_MS: 1_000,
    }),
    loginAssistance,
    queryClient,
  });
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route Component={AppRouteLayout}>
        <Route
          Component={LoginPage}
          handle={{
            resolveTitle: (translations: AppRouteTranslations) => translations.app("authentication.title"),
          }}
          path="/login"
        />
        <Route Component={AppAuthGate}>
          <Route Component={RouteScrollContentReady}>
            <Route
              Component={ProtectedScreen}
              handle={{
                resolveTitle: (translations: AppRouteTranslations) => translations.app("navigation.home"),
              }}
              path="/protected"
            >
              <Route Component={ProtectedChildScreen} path="child" />
            </Route>
          </Route>
        </Route>
      </Route>,
    ),
    { initialEntries: [initialEntry] },
  );

  render(
    <AppRenderErrorBoundary>
      <AppLocalizationProvider initialLocale={resolveInitialLocale()}>
        <LocalizedThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppAuthProvider runtime={runtime}>
              {localeSwitcher ? <LocaleSwitch /> : null}
              <RouterProvider router={router} />
            </AppAuthProvider>
          </QueryClientProvider>
        </LocalizedThemeProvider>
      </AppLocalizationProvider>
    </AppRenderErrorBoundary>,
  );

  return { queryClient, runtime };
}

afterEach(() => {
  mockAuthSessionStore.reset();
  vi.restoreAllMocks();
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  }
});

describe("application authentication flow", () => {
  it("remounts protected consumers without exposing cached data after an identity change", async () => {
    const user = userEvent.setup();
    mockAuthSessionStore.start();
    const { queryClient } = renderAuthFlow();
    const identityOutput = await screen.findByRole("status", { name: "Identity-bound data" });
    await waitFor(() => expect(identityOutput).toHaveTextContent("demo-user:demo-user"));
    await user.type(screen.getByRole("textbox", { name: "Protected draft" }), "private draft");

    const nextUser = {
      displayName: "Second User",
      email: "second@example.com",
      id: "second-user",
    };
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, () =>
        HttpResponse.json(serializeSpringSessionUser(nextUser)),
      ),
    );
    const observedValues: Array<string | null> = [identityOutput.textContent];
    const observer = new MutationObserver(() =>
      observedValues.push(screen.queryByRole("status", { name: "Identity-bound data" })?.textContent ?? null),
    );
    observer.observe(document.body, { characterData: true, childList: true, subtree: true });

    await queryClient.refetchQueries({ exact: true, queryKey: AppAuthQueryKey.session() });

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Identity-bound data" })).toHaveTextContent("second-user:second-user"),
    );
    observer.disconnect();
    expect(observedValues).not.toContain("second-user:demo-user");
    expect(screen.getByRole("textbox", { name: "Protected draft" })).toHaveValue("");
  });

  it("retains protected drafts through a temporary session outage and recovery", async () => {
    const user = userEvent.setup();
    mockAuthSessionStore.start();
    const { queryClient } = renderAuthFlow();
    const draft = await screen.findByRole("textbox", { name: "Protected draft" });
    await user.type(draft, "unsaved work");
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );

    await queryClient.refetchQueries({ exact: true, queryKey: AppAuthQueryKey.session() });

    expect(screen.getByRole("heading", { name: "Protected screen" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Something went wrong" })).not.toBeInTheDocument();
    expect(draft).toHaveValue("unsaved work");

    server.use(...createAuthHandlers(apiBaseUrl));
    await queryClient.refetchQueries({ exact: true, queryKey: AppAuthQueryKey.session() });

    await waitFor(() => expect(queryClient.getQueryState(AppAuthQueryKey.session())?.status).toBe("success"));
    expect(draft).toHaveValue("unsaved work");
  });

  it("routes an initial session failure through the fatal render boundary", async () => {
    renderAuthFlow({
      sessionResponse: () => HttpResponse.json({ message: "unavailable" }, { status: 503 }),
    });

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Protected screen" })).not.toBeInTheDocument();
  });

  it("waits for protected content before applying an initial fragment", async () => {
    let releaseSession: () => void = () => undefined;
    const sessionDelay = new Promise<void>(resolve => {
      releaseSession = resolve;
    });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    mockAuthSessionStore.start();

    renderAuthFlow({
      initialEntry: "/protected#protected-details",
      sessionDelay,
    });

    expect(await screen.findByRole("progressbar")).toBeVisible();
    expect(scrollIntoView).not.toHaveBeenCalled();
    releaseSession();
    expect(await screen.findByRole("heading", { name: "Protected details" })).toBeVisible();
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      }),
    );
  });

  it("renders startup-provided mock credentials without importing mocks into app source", async () => {
    renderAuthFlow({ loginAssistance: mockLoginCredentials });

    expect(await screen.findByText("Demo credentials: demo / demo-password")).toBeVisible();
  });

  it("shows invalid credentials locally, returns after login, and protects after logout", async () => {
    const user = userEvent.setup();
    renderAuthFlow();

    await waitFor(() => expect(document.title).toBe("Sign in · RGO application"));
    expect(screen.queryByText("Protected child screen")).not.toBeInTheDocument();

    await user.type(await screen.findByRole("textbox", { name: /Username/ }), "demo");
    await user.type(screen.getByLabelText(/Password/), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Invalid username or password.")).toBeVisible();

    await user.clear(screen.getByLabelText(/Password/));
    await user.type(screen.getByLabelText(/Password/), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Protected screen" })).toBeVisible();
    expect(screen.getByText("Protected child screen")).toBeVisible();
    const accountButton = screen.getByRole("button", { name: "Account RD" });
    expect(accountButton).toHaveAttribute("aria-haspopup", "menu");
    await user.click(accountButton);
    expect(await screen.findByText("RGO Demo User")).toBeVisible();

    expect(screen.getByRole("menu", { name: "Account" })).toBeVisible();
    const signOutButton = screen.getByRole("menuitem", { name: "Sign out" });
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
    await user.click(signOutButton);
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeVisible();
    await waitFor(() => expect(document.title).toBe("Sign in · RGO application"));
  });

  it("leaves protected content and clears feature data when session revalidation becomes anonymous", async () => {
    mockAuthSessionStore.start();
    const { queryClient } = renderAuthFlow();
    expect(await screen.findByRole("heading", { name: "Protected screen" })).toBeVisible();
    queryClient.setQueryData(["projects"], [{ id: "private" }]);
    mockAuthSessionStore.expire();

    await queryClient.refetchQueries({
      exact: true,
      queryKey: AppAuthQueryKey.session(),
    });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    expect(queryClient.getQueryState(AppAuthQueryKey.session())).toMatchObject({
      fetchStatus: "idle",
      status: "success",
    });
  });

  it("distinguishes an unavailable login service from invalid credentials", async () => {
    const user = userEvent.setup();
    renderAuthFlow();
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );

    await user.type(await screen.findByRole("textbox", { name: /Username/ }), "demo");
    await user.type(screen.getByLabelText(/Password/), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Sign in failed. Try again.")).toBeVisible();
    expect(screen.queryByText("Invalid username or password.")).not.toBeInTheDocument();
  });

  it("keeps a rejected draft and translates allowlisted server field errors on locale changes", async () => {
    const user = userEvent.setup();
    renderAuthFlow({ localeSwitcher: true });
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () =>
        HttpResponse.json(
          {
            code: "VALIDATION_FAILED",
            message: "SECRET SQL and rejected password",
            fieldErrors: [
              { field: "username", code: "TOO_LONG" },
              { field: "unknown", code: "REQUIRED" },
              { field: "password", code: "UNTRUSTED_MESSAGE" },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const username = await screen.findByRole("textbox", { name: /Username/ });
    const password = screen.getByLabelText(/Password/);
    const draft = "a".repeat(101);
    await user.type(username, draft);
    await user.type(password, "preserved-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Some fields need attention.")).toBeVisible();
    expect(username).toHaveAccessibleDescription("This value is too long.");
    expect(username).toHaveValue(draft);
    expect(password).toHaveValue("preserved-password");
    expect(screen.queryByText(/SECRET SQL/)).not.toBeInTheDocument();
    expect(screen.queryByText("UNTRUSTED_MESSAGE")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use Croatian" }));
    expect(await screen.findByText("Potrebno je provjeriti neka polja.")).toBeVisible();
    expect(username).toHaveAccessibleDescription("Ova je vrijednost preduga.");
    expect(username).toHaveValue(draft);
    await user.type(username, "b");
    expect(screen.queryByText("Potrebno je provjeriti neka polja.")).not.toBeInTheDocument();
    expect(username).not.toHaveAccessibleDescription("Ova je vrijednost preduga.");
    await user.click(screen.getByRole("button", { name: "Use English" }));
  });

  it("presents a CSRF failure with local recovery text and retains login input", async () => {
    const user = userEvent.setup();
    renderAuthFlow();
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.login}`, () =>
        HttpResponse.json(
          {
            code: "CSRF_INVALID",
            message: "private server prose",
            fieldErrors: [],
          },
          { status: 403 },
        ),
      ),
    );
    const username = await screen.findByRole("textbox", { name: /Username/ });
    await user.type(username, "demo");
    await user.type(screen.getByLabelText(/Password/), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("The security check failed. Try again.")).toBeVisible();
    expect(username).toHaveValue("demo");
    expect(screen.queryByText("private server prose")).not.toBeInTheDocument();
  });

  it("disables logout while pending and reports a logout failure", async () => {
    const user = userEvent.setup();
    renderAuthFlow();
    await user.type(await screen.findByRole("textbox", { name: /Username/ }), "demo");
    await user.type(screen.getByLabelText(/Password/), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: "Protected screen" });

    let releaseLogout: () => void = () => undefined;
    const pendingLogout = new Promise<void>(resolve => {
      releaseLogout = resolve;
    });
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.logout}`, async () => {
        await pendingLogout;
        return HttpResponse.json({ message: "unavailable" }, { status: 503 });
      }),
    );

    await user.click(screen.getByRole("button", { name: "Account RD" }));
    const logoutButton = await screen.findByRole("menuitem", {
      name: "Sign out",
    });
    await user.click(logoutButton);
    expect(logoutButton).toHaveAttribute("aria-disabled", "true");

    releaseLogout();
    expect(await screen.findByText("Sign out failed. Try again.")).toBeVisible();
    expect(logoutButton).not.toHaveAttribute("aria-disabled", "true");
  });
});
import { createAppAuthRuntime } from "@/app/auth/createAppAuthRuntime";
