import axios from "axios";

export type AppHttpErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_REQUEST"
  | "AUTHENTICATION_REQUIRED"
  | "AUTHENTICATION_FAILED"
  | "CSRF_INVALID"
  | "FORBIDDEN"
  | "REQUEST_REJECTED"
  | "INTERNAL_ERROR";
export type AppHttpFieldErrorCode = "REQUIRED" | "TOO_LONG";
export type AppHttpError = Readonly<{
  code: AppHttpErrorCode;
  fieldErrors: readonly Readonly<{ field: string; code: AppHttpFieldErrorCode }>[];
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompatibleCode(code: unknown, status: number): code is AppHttpErrorCode {
  switch (code) {
    case "VALIDATION_FAILED":
    case "INVALID_REQUEST":
      return status === 400;
    case "AUTHENTICATION_REQUIRED":
    case "AUTHENTICATION_FAILED":
      return status === 401;
    case "CSRF_INVALID":
    case "FORBIDDEN":
      return status === 403;
    case "REQUEST_REJECTED":
      return status >= 400 && status < 500 && ![400, 401, 403].includes(status);
    case "INTERNAL_ERROR":
      return status >= 500 && status < 600;
    default:
      return false;
  }
}

/** Reads bounded public metadata without changing the original Axios failure or trusting its prose. */
export function decodeAppHttpError(error: unknown, allowedFields: readonly string[] = []): AppHttpError | null {
  if (!axios.isAxiosError(error) || axios.isCancel(error) || !error.response) return null;
  const payload: unknown = error.response.data;
  if (
    !isObject(payload) ||
    !Object.hasOwn(payload, "code") ||
    !isCompatibleCode(payload.code, error.response.status) ||
    !Object.hasOwn(payload, "message") ||
    typeof payload.message !== "string" ||
    payload.message.length > 512 ||
    !Object.hasOwn(payload, "fieldErrors") ||
    !Array.isArray(payload.fieldErrors) ||
    payload.fieldErrors.length > 32
  )
    return null;

  const fieldErrors: Array<{ field: string; code: AppHttpFieldErrorCode }> = [];
  const seen = new Set<string>();
  for (const detail of payload.fieldErrors as unknown[]) {
    if (
      !isObject(detail) ||
      !Object.hasOwn(detail, "field") ||
      !Object.hasOwn(detail, "code") ||
      typeof detail.field !== "string" ||
      detail.field.length > 100 ||
      typeof detail.code !== "string" ||
      detail.code.length > 100
    )
      return null;
    if (
      payload.code !== "VALIDATION_FAILED" ||
      !allowedFields.includes(detail.field) ||
      ["__proto__", "constructor", "prototype"].includes(detail.field) ||
      (detail.code !== "REQUIRED" && detail.code !== "TOO_LONG") ||
      seen.has(detail.field)
    )
      continue;
    seen.add(detail.field);
    fieldErrors.push({ field: detail.field, code: detail.code });
  }
  return { code: payload.code, fieldErrors };
}

/** The caller owns unknown-error wording; recognized failures share local translations. */
export function appHttpErrorMessageKey(error: AppHttpError | null) {
  switch (error?.code) {
    case "VALIDATION_FAILED":
      return "httpErrors.validationFailed";
    case "INVALID_REQUEST":
      return "httpErrors.invalidRequest";
    case "AUTHENTICATION_REQUIRED":
    case "AUTHENTICATION_FAILED":
      return "httpErrors.authenticationRequired";
    case "CSRF_INVALID":
      return "httpErrors.csrfInvalid";
    case "FORBIDDEN":
      return "httpErrors.forbidden";
    case "REQUEST_REJECTED":
      return "httpErrors.requestRejected";
    case "INTERNAL_ERROR":
      return "httpErrors.internalError";
    default:
      return null;
  }
}
