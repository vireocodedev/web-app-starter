import { z } from "zod";

/** Accepts Vite's string values as well as injected boolean test values. */
export const booleanEnvironmentSchema = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform(value => value === "true"),
]);
