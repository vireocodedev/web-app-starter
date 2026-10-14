import { Fragment, type PropsWithChildren } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { AppAuthContext } from "../contexts/AppAuthContext";
import type { AppAuthRuntime } from "../createAppAuthRuntime";

export function AppAuthProvider({ children, runtime }: PropsWithChildren<{ runtime: AppAuthRuntime }>) {
  const session = useQuery(runtime.query.session());
  const login = useMutation(runtime.mutation.login);
  const logout = useMutation(runtime.mutation.logout);
  const status = session.isPending ? "loading" : session.data ? "authenticated" : "anonymous";
  if (session.isError && session.data === undefined) throw session.error;
  const identityLifetimeKey = session.data?.id ?? (session.data === null ? "anonymous" : "pending");

  return (
    <AppAuthContext.Provider
      value={{
        isLoggingOut: logout.isPending,
        loginAssistance: runtime.loginAssistance,
        login: async credentials => {
          await login.mutateAsync(credentials);
        },
        logout: async () => {
          await logout.mutateAsync();
        },
        status,
        user: session.data ?? null,
      }}
    >
      <Fragment key={identityLifetimeKey}>{children}</Fragment>
    </AppAuthContext.Provider>
  );
}
