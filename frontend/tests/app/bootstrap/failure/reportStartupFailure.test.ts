import { describe, expect, it, vi } from "vitest";

import { loadAppConfig } from "@/app/bootstrap/config/loadAppConfig";
import { reportStartupFailure } from "@/app/bootstrap/failure/reportStartupFailure";

function captureMissingConfigurationError() {
  try {
    loadAppConfig({}, { isProductionBuild: false });
  } catch (error) {
    return error;
  }

  throw new Error("Expected application configuration validation to fail.");
}

describe("reportStartupFailure", () => {
  it("logs the original startup error during development", () => {
    const startupError = captureMissingConfigurationError();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportStartupFailure(startupError, { isDevelopment: true });

    expect(startupError).toBeInstanceOf(Error);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining((startupError as Error).message), startupError);
    expect(consoleError.mock.calls[0]?.[0]).toContain("VITE_API_BASE_URL");
  });

  it("does not expose the raw startup error in production", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportStartupFailure(new Error("Sensitive diagnostic detail"), {
      isDevelopment: false,
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});
