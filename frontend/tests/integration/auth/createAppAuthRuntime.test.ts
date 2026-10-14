import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { createAppAxios } from "@/app/data/http/createAppAxios";
import { server } from "@test/server";
import { createAuthHandlers, mockAuthSessionStore, mockAuthUser, mockLoginCredentials } from "@mocks/auth";
import { createAppAuthRuntime } from "@/app/auth/createAppAuthRuntime";
import { AppInvalidCredentialsError } from "@/app/auth/api/appAuth.api";
import { appAuthSpringSessionEndpoints } from "@/app/auth/api/appAuth.api.springSession";
import { AppAuthQueryKey } from "@/app/auth/api/appAuth.querykeys";

const apiBaseUrl = "https://api.example.invalid";

afterEach(() => mockAuthSessionStore.reset());

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createRuntime() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const httpClient = createAppAxios({
    VITE_API_BASE_URL: apiBaseUrl,
    VITE_APP_ENV: "test",
    VITE_API_MODE: "http",
    VITE_API_WITH_CREDENTIALS: true,
    VITE_REQUEST_TIMEOUT_MS: 1_000,
  });
  return {
    auth: createAppAuthRuntime({ http: httpClient, queryClient }),
    httpClient,
    queryClient,
  };
}

describe("application authentication runtime", () => {
  it("starts a new cache lifetime before accepting a different authenticated identity", async () => {
    const requestStarted = deferred<void>();
    const lateFeatureResponse = deferred<readonly { owner: string }[]>();
    const nextUser = {
      displayName: "Second User",
      email: "second@example.com",
      id: "second-user",
    };
    server.use(http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, () => HttpResponse.json(nextUser)));
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(AppAuthQueryKey.session(), mockAuthUser);
    queryClient.setQueryData(["projects"], [{ owner: mockAuthUser.id }]);
    let pendingFeatureAborted = false;
    const pendingFeature = queryClient.fetchQuery({
      queryFn: async ({ signal }) => {
        signal.addEventListener("abort", () => {
          pendingFeatureAborted = true;
        });
        requestStarted.resolve();
        return lateFeatureResponse.promise;
      },
      queryKey: ["pending-projects"],
    });
    await requestStarted.promise;

    await expect(queryClient.fetchQuery({ ...auth.query.session(), staleTime: 0 })).resolves.toEqual(nextUser);

    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toEqual(nextUser);
    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    expect(queryClient.getQueryData(["pending-projects"])).toBeUndefined();
    expect(pendingFeatureAborted).toBe(true);

    lateFeatureResponse.resolve([{ owner: mockAuthUser.id }]);
    await pendingFeature.catch(() => undefined);
    expect(queryClient.getQueryData(["pending-projects"])).toBeUndefined();
  });

  it("preserves identity-bound queries when the accepted user is unchanged", async () => {
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, () => HttpResponse.json(mockAuthUser)),
    );
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(AppAuthQueryKey.session(), mockAuthUser);
    queryClient.setQueryData(["projects"], [{ owner: mockAuthUser.id }]);

    await expect(queryClient.fetchQuery({ ...auth.query.session(), staleTime: 0 })).resolves.toEqual(mockAuthUser);

    expect(queryClient.getQueryData(["projects"])).toEqual([{ owner: mockAuthUser.id }]);
  });

  it("repeatedly expires and clears identity-bound queries when no session is cached", async () => {
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(["projects"], [{ id: "private" }]);

    await auth.expire();
    await auth.expire();

    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toBeNull();
  });

  it("expires identity and clears identity-bound queries after an unexpected 401", async () => {
    mockAuthSessionStore.start();
    server.use(
      ...createAuthHandlers(apiBaseUrl),
      http.get(`${apiBaseUrl}/expired`, () => HttpResponse.json({ message: "expired" }, { status: 401 })),
    );
    const { auth, httpClient, queryClient } = createRuntime();
    await queryClient.fetchQuery(auth.query.session());
    queryClient.setQueryData(["projects"], [{ id: "private" }]);
    await expect(httpClient.get("/expired")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    expect(queryClient.getQueryData(["app-auth", "session"])).toBeNull();
  });

  it.each([
    ["explicit expiry", async (auth: ReturnType<typeof createRuntime>) => auth.auth.expire()],
    [
      "unexpected 401 expiry",
      async ({ httpClient }: ReturnType<typeof createRuntime>) => {
        await expect(httpClient.get("/expired")).rejects.toMatchObject({
          response: { status: 401 },
        });
      },
    ],
  ])("prevents a pending session read from restoring identity after %s", async (_, expire) => {
    const requestStarted = deferred<void>();
    const response = deferred<Response>();
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, async () => {
        requestStarted.resolve();
        return response.promise;
      }),
      http.get(`${apiBaseUrl}/expired`, () => HttpResponse.json({ message: "expired" }, { status: 401 })),
    );
    const runtime = createRuntime();
    runtime.queryClient.setQueryData(["projects"], [{ id: "private" }]);
    const sessionRead = runtime.queryClient.fetchQuery(runtime.auth.query.session());
    await requestStarted.promise;

    await expire(runtime);
    response.resolve(HttpResponse.json(mockAuthUser));
    await sessionRead.catch(() => undefined);

    expect(runtime.queryClient.getQueryData(AppAuthQueryKey.session())).toBeNull();
    expect(runtime.queryClient.getQueryData(["projects"])).toBeUndefined();
  });

  it("keeps a completed login authoritative over a stale anonymous read", async () => {
    const requestStarted = deferred<void>();
    const staleResponse = deferred<Response>();
    let sessionRequestCount = 0;
    server.use(...createAuthHandlers(apiBaseUrl));
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, async () => {
        sessionRequestCount += 1;
        if (sessionRequestCount === 1) {
          requestStarted.resolve();
          return staleResponse.promise;
        }
        return HttpResponse.json(mockAuthUser);
      }),
    );
    const { auth, queryClient } = createRuntime();
    const staleRead = queryClient.fetchQuery(auth.query.session());
    await requestStarted.promise;
    queryClient.setQueryData(["projects"], [{ id: "previous-user" }]);

    const user = await auth.mutation.login.mutationFn(mockLoginCredentials);
    await auth.mutation.login.onSuccess(user);
    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    queryClient.setQueryData(["projects"], [{ id: "current-user" }]);
    staleResponse.resolve(new HttpResponse(null, { status: 401 }));
    await staleRead.catch(() => undefined);

    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toEqual(mockAuthUser);
    expect(queryClient.getQueryData(["projects"])).toEqual([{ id: "current-user" }]);
  });

  it("keeps a completed logout authoritative over a stale authenticated read", async () => {
    const requestStarted = deferred<void>();
    const staleResponse = deferred<Response>();
    server.use(...createAuthHandlers(apiBaseUrl));
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, async () => {
        requestStarted.resolve();
        return staleResponse.promise;
      }),
    );
    const { auth, queryClient } = createRuntime();
    const staleRead = queryClient.fetchQuery(auth.query.session());
    await requestStarted.promise;
    queryClient.setQueryData(["projects"], [{ id: "current-user" }]);

    await auth.mutation.logout.mutationFn();
    await auth.mutation.logout.onSuccess();
    expect(queryClient.getQueryData(["projects"])).toBeUndefined();
    staleResponse.resolve(HttpResponse.json(mockAuthUser));
    await staleRead.catch(() => undefined);

    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toBeNull();
  });

  it("does not turn a rejected login into global session expiry", async () => {
    server.use(...createAuthHandlers(apiBaseUrl));
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(["projects"], [{ id: "private" }]);
    await expect(
      auth.mutation.login.mutationFn({
        password: "wrong",
        username: "demo",
      }),
    ).rejects.toBeInstanceOf(AppInvalidCredentialsError);

    expect(queryClient.getQueryData(["projects"])).toEqual([{ id: "private" }]);
  });

  it("preserves the current session and feature data after a non-401 logout failure", async () => {
    server.use(...createAuthHandlers(apiBaseUrl));
    server.use(
      http.post(`${apiBaseUrl}${appAuthSpringSessionEndpoints.logout}`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(AppAuthQueryKey.session(), mockAuthUser);
    queryClient.setQueryData(["projects"], [{ id: "private" }]);

    await expect(auth.mutation.logout.mutationFn()).rejects.toMatchObject({
      response: { status: 503 },
    });

    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toEqual(mockAuthUser);
    expect(queryClient.getQueryData(["projects"])).toEqual([{ id: "private" }]);
  });

  it("preserves session and feature data after a non-401 session read failure", async () => {
    server.use(
      http.get(`${apiBaseUrl}${appAuthSpringSessionEndpoints.session}`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );
    const { auth, queryClient } = createRuntime();
    queryClient.setQueryData(AppAuthQueryKey.session(), mockAuthUser);
    queryClient.setQueryData(["projects"], [{ id: "private" }]);

    await expect(queryClient.fetchQuery({ ...auth.query.session(), staleTime: 0 })).rejects.toMatchObject({
      response: { status: 503 },
    });

    expect(queryClient.getQueryData(AppAuthQueryKey.session())).toEqual(mockAuthUser);
    expect(queryClient.getQueryData(["projects"])).toEqual([{ id: "private" }]);
  });
});
