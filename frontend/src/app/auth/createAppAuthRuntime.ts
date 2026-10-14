import type { QueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { createSpringSessionAppAuthApi, observeSpringSessionExpiry } from "./api/appAuth.api.springSession";
import { createAppAuthMutation } from "./api/appAuth.mutation";
import { AppAuthQuery } from "./api/appAuth.query";
import { AppAuthQueryKey } from "./api/appAuth.querykeys";
import type { AppAuthUser } from "./models/AppAuthUser";
import type { AppAuthLoginAssistance } from "./types/AppAuthLoginAssistance";

/** The one auth module callers receive through AppAuthProvider. */
export function createAppAuthRuntime({
  http,
  loginAssistance,
  queryClient,
}: Readonly<{
  http: AxiosInstance;
  loginAssistance?: AppAuthLoginAssistance;
  queryClient: QueryClient;
}>) {
  const api = createSpringSessionAppAuthApi(http);
  let sessionGeneration = 0;
  const identityQuery = (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== "app-auth";
  const removeIdentityQueries = () => {
    queryClient.removeQueries({
      predicate: identityQuery,
    });
  };
  const cancelIdentityQueries = () => queryClient.cancelQueries({ predicate: identityQuery });
  const replaceSession = async (session: Awaited<ReturnType<typeof api.getSession>>) => {
    const transitionGeneration = ++sessionGeneration;
    await queryClient.cancelQueries({
      exact: true,
      queryKey: AppAuthQueryKey.session(),
    });
    await cancelIdentityQueries();
    if (transitionGeneration !== sessionGeneration) return;
    removeIdentityQueries();
    queryClient.setQueryData(AppAuthQueryKey.session(), session);
  };
  const getSession = async () => {
    const generation = sessionGeneration;
    const acceptedSession = queryClient.getQueryData<AppAuthUser | null>(AppAuthQueryKey.session());
    const session = await api.getSession();
    if (generation === sessionGeneration) {
      if (session === null) {
        const transitionGeneration = ++sessionGeneration;
        await cancelIdentityQueries();
        if (transitionGeneration === sessionGeneration) removeIdentityQueries();
      } else if (acceptedSession !== undefined && acceptedSession?.id !== session.id) {
        const transitionGeneration = ++sessionGeneration;
        await cancelIdentityQueries();
        if (transitionGeneration === sessionGeneration) removeIdentityQueries();
      }
    }
    return session;
  };
  const expire = () => {
    sessionGeneration += 1;
    const sessionCancellation = queryClient.cancelQueries({
      exact: true,
      queryKey: AppAuthQueryKey.session(),
    });
    const identityCancellation = cancelIdentityQueries();
    removeIdentityQueries();
    queryClient.setQueryData(AppAuthQueryKey.session(), null);
    return Promise.all([sessionCancellation, identityCancellation]).then(() => undefined);
  };
  observeSpringSessionExpiry(http, expire);
  return Object.freeze({
    expire,
    loginAssistance,
    mutation: createAppAuthMutation(api, replaceSession),
    query: { session: () => AppAuthQuery.session(getSession) },
  });
}

export type AppAuthRuntime = ReturnType<typeof createAppAuthRuntime>;
