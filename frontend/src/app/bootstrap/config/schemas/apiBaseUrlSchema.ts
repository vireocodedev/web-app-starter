import { z } from "zod";

function normalizeApiBaseUrl(value: string): string {
  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    throw new Error("VITE_API_BASE_URL must be HTTPS or a same-origin base path.");
  }

  if (value.startsWith("//") || value.includes("\\") || decodedValue.split("/").includes("..")) {
    throw new Error("VITE_API_BASE_URL must be HTTPS or a same-origin base path.");
  }

  if (value.startsWith("/")) {
    if (value.includes("?") || value.includes("#")) {
      throw new Error("VITE_API_BASE_URL must not contain a query or fragment.");
    }
    return value === "/" ? "/" : value.replace(/\/+$/, "");
  }

  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("VITE_API_BASE_URL must be HTTPS or a same-origin base path.");
  }

  return url.toString().replace(/\/$/, "");
}

/** Validates and normalizes the public URL used by the Axios boundary. */
export const apiBaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context) => {
    try {
      return normalizeApiBaseUrl(value);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "VITE_API_BASE_URL must be HTTPS or a same-origin base path.",
      });
      return z.NEVER;
    }
  });
