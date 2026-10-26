package com.vireocode.backend.http;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

import org.jspecify.annotations.Nullable;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected @Nullable ResponseEntity<Object> handleExceptionInternal(Exception exception, @Nullable Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Object safeBody = ApiErrors.forStatus(status);
        if (status.value() == 400 && (exception instanceof MethodArgumentNotValidException
                || exception instanceof HandlerMethodValidationException)) {
            safeBody = ApiErrors.validationFailure();
        }
        var safeHeaders = new HttpHeaders();
        safeHeaders.putAll(headers);
        safeHeaders.setContentType(MediaType.APPLICATION_JSON);
        return super.handleExceptionInternal(exception, safeBody, safeHeaders, status, request);
    }

    @ExceptionHandler(AuthenticationServiceException.class)
    public ResponseEntity<Object> authenticationUnavailable(AuthenticationServiceException exception) {
        logger.error("Authentication service unavailable", exception);
        return safeResponse(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> authenticationRequired(AuthenticationException exception) {
        return safeResponse(HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> forbidden(AccessDeniedException exception) {
        return safeResponse(HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> unexpectedFailure(Exception exception) {
        var declaredFailure = declaredFailure(exception);
        if (declaredFailure != null) {
            return declaredFailure;
        }
        logger.error("Unhandled API exception", exception);
        return safeResponse(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private @Nullable ResponseEntity<Object> declaredFailure(Exception exception) {
        // Match Spring's declared-status/cause lookup, without exposing its free-form reason.
        Set<Throwable> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        Exception current = exception;
        while (visited.add(current)) {
            if (current instanceof ResponseStatusException declared) {
                return safeResponse(declared.getStatusCode(), declared.getHeaders());
            }
            var annotation = AnnotatedElementUtils.findMergedAnnotation(current.getClass(), ResponseStatus.class);
            if (annotation != null) {
                return safeResponse(annotation.code());
            }
            if (!(current.getCause() instanceof Exception cause)) {
                break;
            }
            current = cause;
        }
        return null;
    }

    private ResponseEntity<Object> safeResponse(HttpStatusCode status) {
        return safeResponse(status, HttpHeaders.EMPTY);
    }

    private ResponseEntity<Object> safeResponse(HttpStatusCode status, HttpHeaders headers) {
        var safeHeaders = new HttpHeaders();
        safeHeaders.putAll(headers);
        safeHeaders.setContentType(MediaType.APPLICATION_JSON);
        return new ResponseEntity<>(ApiErrors.forStatus(status), safeHeaders, status);
    }
}
