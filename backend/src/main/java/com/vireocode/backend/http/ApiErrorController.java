package com.vireocode.backend.http;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Servlet error dispatches use the same safe envelope, including HTML clients. */
@RestController
@RequestMapping("${spring.web.error.path:${error.path:/error}}")
public class ApiErrorController implements ErrorController {

    @RequestMapping
    public ResponseEntity<Object> error(HttpServletRequest request) {
        Object statusAttribute = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int status = statusAttribute instanceof Integer value && value >= 400 && value <= 599 ? value : 500;
        var statusCode = HttpStatusCode.valueOf(status);
        return ResponseEntity.status(statusCode).contentType(MediaType.APPLICATION_JSON)
                .body(ApiErrors.forStatus(statusCode));
    }
}
