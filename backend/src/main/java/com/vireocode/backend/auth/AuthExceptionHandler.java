package com.vireocode.backend.auth;

import java.util.HashMap;

import com.vireocode.backend.http.ApiErrors;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
@Order(0)
public class AuthExceptionHandler {

    @ExceptionHandler(AuthenticationServiceException.class)
    public ResponseEntity<?> authenticationUnavailable() {
        return ApiErrors.authenticationUnavailable();
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> authenticationFailure() {
        return ApiErrors.authenticationFailure();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> invalidLogin(MethodArgumentNotValidException exception) {
        var fields = new HashMap<String, String>();
        if (exception.getBindingResult().getTarget() instanceof AuthController.LoginRequest) {
            for (var error : exception.getBindingResult().getFieldErrors()) {
                if (!error.getField().equals("username") && !error.getField().equals("password")) {
                    continue;
                }
                if ("NotBlank".equals(error.getCode())) {
                    fields.put(error.getField(), "REQUIRED");
                } else if ("Size".equals(error.getCode())) {
                    fields.putIfAbsent(error.getField(), "TOO_LONG");
                }
            }
        }
        return ApiErrors.validationFailure(fields);
    }
}
