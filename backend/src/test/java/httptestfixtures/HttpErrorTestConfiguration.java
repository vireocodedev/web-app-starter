package httptestfixtures;

import java.io.IOException;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

/** Explicitly imported; these endpoints live outside the application's component scan. */
@TestConfiguration(proxyBeanMethods = false)
@Import(HttpErrorTestConfiguration.ErrorEndpoints.class)
public class HttpErrorTestConfiguration {

    @Bean
    static BeanPostProcessor authenticationOutageSimulation() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (!beanName.equals("authenticationManager") || !(bean instanceof AuthenticationManager delegate)) {
                    return bean;
                }
                return (AuthenticationManager) authentication -> {
                    if (authentication.getName().equals("test-authentication-outage")) {
                        throw new AuthenticationServiceException("secret-user-store-password SQL database unavailable");
                    }
                    if (authentication.getName().equals("test-internal-authentication-outage")) {
                        throw new InternalAuthenticationServiceException("secret-internal-user-store-password");
                    }
                    return delegate.authenticate(authentication);
                };
            }
        };
    }

    @RestController
    public static class ErrorEndpoints {

        @GetMapping("/test-errors/unexpected")
        public String unexpected() {
            throw new IllegalStateException("secret-password SQL SELECT * FROM private_accounts");
        }

        @GetMapping("/test-errors/unavailable")
        public String unavailable() {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "secret-database-details") {
                @Override
                public HttpHeaders getHeaders() {
                    var headers = new HttpHeaders();
                    headers.set(HttpHeaders.RETRY_AFTER, "30");
                    return headers;
                }
            };
        }

        @GetMapping("/test-errors/forbidden")
        public String forbidden() {
            throw new AccessDeniedException("secret-authority-details");
        }

        @GetMapping("/test-errors/authentication")
        public String authentication() {
            throw new BadCredentialsException("secret-authentication-details");
        }

        @GetMapping("/test-errors/authentication-service")
        public String authenticationService() {
            throw new InternalAuthenticationServiceException("secret-authentication-service-details");
        }

        @GetMapping("/test-errors/declared-conflict")
        public String declaredConflict() {
            throw new DeclaredConflict();
        }

        @GetMapping("/test-errors/inherited-conflict")
        public String inheritedConflict() {
            throw new InheritedConflict();
        }

        @GetMapping("/test-errors/composed-conflict")
        public String composedConflict() {
            throw new ComposedConflict();
        }

        @GetMapping("/test-errors/wrapped-conflict")
        public String wrappedConflict() {
            throw new IllegalStateException("secret-wrapper-details", new DeclaredConflict());
        }

        @GetMapping("/test-errors/cyclic-causes")
        public String cyclicCauses() {
            var first = new IllegalStateException("secret-first-cause");
            var second = new IllegalArgumentException("secret-second-cause");
            first.initCause(second);
            second.initCause(first);
            throw first;
        }

        @GetMapping("/test-errors/servlet")
        public void servletError(HttpServletResponse response) throws IOException {
            response.sendError(502, "secret-servlet-details");
        }

        @GetMapping("/test-errors/validation")
        public String validation(@RequestParam @Size(max = 3) String name) {
            return name;
        }

        @GetMapping("/test-errors/return-validation")
        @NotBlank
        public String returnValidation() {
            return "";
        }
    }

    @ResponseStatus(code = HttpStatus.CONFLICT, reason = "secret-conflict-reason")
    static class DeclaredConflict extends RuntimeException {
    }

    static class InheritedConflict extends DeclaredConflict {
    }

    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @ResponseStatus(code = HttpStatus.CONFLICT, reason = "secret-composed-conflict-reason")
    @interface ConflictFailure {
    }

    @ConflictFailure
    static class ComposedConflict extends RuntimeException {
    }

}
