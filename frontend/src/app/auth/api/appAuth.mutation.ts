import type { AppAuthApi } from "./appAuth.api";
import type { AppLoginCredentials } from "../models/AppLoginCredentials";
import type { AppAuthUser } from "../models/AppAuthUser";

export function createAppAuthMutation(
  api: AppAuthApi,
  replaceSession: (session: AppAuthUser | null) => void | Promise<void>,
) {
  return {
    login: {
      mutationFn: async (credentials: AppLoginCredentials) => {
        await api.login(credentials);
        const user = await api.getSession();
        if (!user) {
          throw new Error("Login completed without an authenticated session.");
        }
        return user;
      },
      onSuccess: (user: AppAuthUser) => replaceSession(user),
    },
    logout: {
      mutationFn: () => api.logout(),
      onSuccess: () => replaceSession(null),
    },
  } as const;
}
