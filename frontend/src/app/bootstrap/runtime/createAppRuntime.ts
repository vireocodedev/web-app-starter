import { createAppAxios } from "@/app/data/http/createAppAxios";
import { createAppAuthRuntime } from "@/app/auth/createAppAuthRuntime";
import type { AppAuthLoginAssistance } from "@/app/auth/types/AppAuthLoginAssistance";
import type { AppConfig } from "@/app/bootstrap/config/appConfig";
import { createAppFixedSettings } from "@/app/bootstrap/config/fixedSettings";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";

import { createAppFeatures } from "./appFeatures";

export function createAppRuntime(
  config: AppConfig,
  options: Readonly<{ loginAssistance?: AppAuthLoginAssistance }> = {},
) {
  const queryClient = createAppQueryClient();
  const http = createAppAxios(config);
  const auth = createAppAuthRuntime({
    http,
    loginAssistance: options.loginAssistance,
    queryClient,
  });
  const features = createAppFeatures({ queryClient });
  const fixedSettings = createAppFixedSettings(config);

  return Object.freeze({
    auth,
    features,
    fixedSettings,
    queryClient,
  });
}

export type AppRuntime = ReturnType<typeof createAppRuntime>;
