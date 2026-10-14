import { createContext } from "react";

import type { AppLoginCredentials } from "../models/AppLoginCredentials";
import type { AppAuthUser } from "../models/AppAuthUser";
import type { AppAuthLoginAssistance } from "../types/AppAuthLoginAssistance";

export type AppAuthContextValue = Readonly<{
  isLoggingOut: boolean;
  loginAssistance?: AppAuthLoginAssistance;
  login(credentials: AppLoginCredentials): Promise<void>;
  logout(): Promise<void>;
  status: "loading" | "anonymous" | "authenticated";
  user: AppAuthUser | null;
}>;

export const AppAuthContext = createContext<AppAuthContextValue | undefined>(undefined);
