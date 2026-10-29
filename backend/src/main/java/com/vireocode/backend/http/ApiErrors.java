package com.vireocode.backend.http;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Fixed public error vocabulary shared by MVC and the security filters. */
@Component
public final class ApiErrors {

    private final ObjectMapper json;

    public ApiErrors(ObjectMapper json) {
        this.json = json;
    }

    public void writeAuthenticationRequired(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, authenticationRequired());
    }

    public void writeAccessDenied(HttpServletResponse response, boolean csrfInvalid) throws IOException {
        write(response, HttpStatus.FORBIDDEN, accessDenied(csrfInvalid));
    }

    public static ResponseEntity<?> authenticationFailure() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).contentType(MediaType.APPLICATION_JSON)
                .body(new PublicError("AUTHENTICATION_FAILED", "Invalid credentials or expired session", List.of()));
    }

    public static ResponseEntity<?> authenticationUnavailable() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).contentType(MediaType.APPLICATION_JSON)
                .body(forStatus(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    public static ResponseEntity<?> validationFailure(Map<String, String> fieldCodes) {
        // Never turn arbitrary binding paths or constraint messages into public metadata.
        var fields = List.of("username", "password").stream()
                .filter(field -> "REQUIRED".equals(fieldCodes.get(field)) || "TOO_LONG".equals(fieldCodes.get(field)))
                .map(field -> new FieldError(field, fieldCodes.get(field)))
                .toList();
        return ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON)
                .body(new PublicError("VALIDATION_FAILED", "Some fields need attention", fields));
    }

    static Object forStatus(HttpStatusCode status) {
        if (status.is5xxServerError()) {
            return new PublicError("INTERNAL_ERROR", "The request could not be completed", List.of());
        }
        return switch (status.value()) {
            case 400 -> invalidRequest();
            case 401 -> authenticationRequired();
            case 403 -> accessDenied(false);
            default -> new PublicError("REQUEST_REJECTED", "The request was rejected", List.of());
        };
    }

    static Object validationFailure() {
        return new PublicError("VALIDATION_FAILED", "Some fields need attention", List.of());
    }

    static Object resourceNotFound() {
        return new PublicError("RESOURCE_NOT_FOUND", "The resource is not available", List.of());
    }

    static Object versionConflict() {
        return new PublicError("VERSION_CONFLICT", "The resource has changed", List.of());
    }

    static Object resourceInUse() {
        return new PublicError("RESOURCE_IN_USE", "The resource is in use", List.of());
    }

    private static PublicError invalidRequest() {
        return new PublicError("INVALID_REQUEST", "The request is not valid", List.of());
    }

    private static PublicError authenticationRequired() {
        return new PublicError("AUTHENTICATION_REQUIRED", "Authentication required", List.of());
    }

    private static PublicError accessDenied(boolean csrfInvalid) {
        return new PublicError(csrfInvalid ? "CSRF_INVALID" : "FORBIDDEN", "Request not permitted", List.of());
    }

    private void write(HttpServletResponse response, HttpStatus status, PublicError error) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getWriter(), error);
    }

    @Schema(name = "ApiError")
    private record PublicError(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {
                    "VALIDATION_FAILED", "INVALID_REQUEST", "AUTHENTICATION_REQUIRED", "AUTHENTICATION_FAILED",
                    "CSRF_INVALID", "FORBIDDEN", "RESOURCE_NOT_FOUND", "VERSION_CONFLICT", "RESOURCE_IN_USE",
                    "REQUEST_REJECTED", "INTERNAL_ERROR" }) String code,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String message,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<FieldError> fieldErrors) {
    }

    private record FieldError(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String field,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String code) {
    }
}
