import { z } from "zod";

import { apiBaseUrlSchema } from "./schemas/apiBaseUrlSchema.js";
import { booleanEnvironmentSchema } from "./schemas/booleanEnvironmentSchema.js";

/** The complete, public Vite contract consumed by this application. */
export const envVariables = {
  VITE_API_BASE_URL: apiBaseUrlSchema,
  VITE_APP_ENV: z.enum(["development", "test", "production"]).default("production"),
  VITE_API_WITH_CREDENTIALS: booleanEnvironmentSchema.default(false),
  VITE_API_MODE: z.enum(["http", "mock"]).default("http"),
  VITE_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  VITE_SETTINGS_NOCFG_LOCALE: z.enum(["en", "hr"]).optional(),
  VITE_SETTINGS_NOCFG_MOTION: z.enum(["system", "reduce"]).optional(),
  VITE_SETTINGS_NOCFG_LINK_UNDERLINES: z.enum(["page", "always"]).optional(),
  VITE_SETTINGS_NOCFG_DRAWER_MODE: z.enum(["temporary", "permanent"]).optional(),
  VITE_SETTINGS_NOCFG_HEADER_STICKINESS: z.enum(["first-row", "both-rows", "none"]).optional(),
  VITE_SETTINGS_NOCFG_FONT_SIZE: z.enum(["normal", "medium", "big"]).optional(),
  VITE_SETTINGS_NOCFG_INCREASED_CONTRAST: booleanEnvironmentSchema.optional(),
  VITE_SETTINGS_NOCFG_DESKTOP_TABLE_SIZE: z.enum(["small", "medium"]).optional(),
  VITE_SETTINGS_NOCFG_THEME: z.enum(["system", "light", "dark", "soft-dark"]).optional(),
  VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION: z.enum(["dialog", "docked", "overlay"]).optional(),
  VITE_SETTINGS_NOCFG_SURFACE_BORDER_RADIUS: z
    .enum(["6", "8", "10", "12", "14", "16", "18"])
    .transform(Number)
    .optional(),
} as const satisfies z.ZodRawShape;
