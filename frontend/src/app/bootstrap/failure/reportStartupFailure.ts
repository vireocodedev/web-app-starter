export type StartupFailureReportingEnvironment = Readonly<{
  isDevelopment: boolean;
}>;

/**
 * Reports actionable local diagnostics without changing provider-independent
 * recovery UI. Production reporting must use a separately sanitized adapter.
 */
export function reportStartupFailure(error: unknown, environment: StartupFailureReportingEnvironment) {
  if (!environment.isDevelopment) return;

  const detail =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown startup failure.";

  console.error(`[application startup] Initialization failed.\n${detail}`, error);
}
