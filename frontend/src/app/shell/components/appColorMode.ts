type AppColorMode = "light" | "dark";

export function resolveAppColorMode(
  mode: AppColorMode | "soft-dark" | "system" | undefined,
  systemMode: AppColorMode | undefined,
): AppColorMode {
  return mode === "system" ? (systemMode ?? "light") : mode === "soft-dark" ? "dark" : (mode ?? "light");
}

export function resolveNextAppColorMode(
  mode: AppColorMode | "soft-dark" | "system" | undefined,
  systemMode: AppColorMode | undefined,
): AppColorMode {
  return resolveAppColorMode(mode, systemMode) === "dark" ? "light" : "dark";
}
