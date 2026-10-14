import { parseAppConfig, type AppConfig } from "./appConfig.js";
import { envVariables } from "./envVariables.js";

const envVariableNames = Object.keys(envVariables) as Array<keyof typeof envVariables>;
const envVariableNameSet: ReadonlySet<string> = new Set(envVariableNames);

export type AppBuildEnvironment = Readonly<{
  isProductionBuild: boolean;
}>;

/** The only config module allowed to read Vite's ambient public environment. */
export function loadAppConfig(
  environment: Record<string, unknown> = import.meta.env,
  buildEnvironment: AppBuildEnvironment = {
    isProductionBuild: import.meta.env.PROD,
  },
): AppConfig {
  const unknownPublicKeys = Object.keys(environment).filter(
    key => key.startsWith("VITE_") && !envVariableNameSet.has(key),
  );

  if (unknownPublicKeys.length > 0) {
    throw new Error(`Unknown public configuration: ${unknownPublicKeys.sort().join(", ")}`);
  }

  const config = parseAppConfig(
    Object.fromEntries(
      envVariableNames.filter(key => environment[key] !== undefined).map(key => [key, environment[key]]),
    ),
  );
  if (buildEnvironment.isProductionBuild && config.VITE_API_MODE === "mock") {
    throw new Error("VITE_API_MODE=mock is not permitted in production builds.");
  }
  return config;
}
