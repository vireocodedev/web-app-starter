import { z } from "zod";

import { envVariables } from "./envVariables.js";

const appConfigSchema = z.object(envVariables).strict().readonly();

export type AppConfig = z.output<typeof appConfigSchema>;

/** Parses an injected, explicitly public Vite value record. */
export function parseAppConfig(environment: Record<string, unknown>): AppConfig {
  return appConfigSchema.parse(environment);
}
