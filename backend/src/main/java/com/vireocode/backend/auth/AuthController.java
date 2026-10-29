package com.vireocode.backend.auth;

import com.vireocode.backend.user.AppUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SessionAuthenticationStrategy sessionAuthentication;
    private final SecurityContextRepository securityContexts;
    private final AppUserRepository users;

    public AuthController(AuthenticationManager authenticationManager,
            SessionAuthenticationStrategy sessionAuthentication,
            SecurityContextRepository securityContexts, AppUserRepository users) {
        this.authenticationManager = authenticationManager;
        this.sessionAuthentication = sessionAuthentication;
        this.securityContexts = securityContexts;
        this.users = users;
    }

    @GetMapping("/csrf")
    @Operation(summary = "Get a CSRF token for the current session",
            description = "Available before login. Keep the browser cookie; fetch a fresh token after successful login.")
    @SecurityRequirements
    public CsrfResponse csrf(@Parameter(hidden = true) CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Log in with username and password",
            description = "Requires the token from GET /auth/csrf and its browser cookie. Success rotates both the session "
                    + "identity and CSRF token; reacquire CSRF before the next mutation.",
            security = @SecurityRequirement(name = "csrfToken"),
            responses = {
                    @ApiResponse(responseCode = "204", description = "Authenticated; no response body"),
                    @ApiResponse(responseCode = "400", description = "INVALID_REQUEST or VALIDATION_FAILED",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError"))),
                    @ApiResponse(responseCode = "401", description = "AUTHENTICATION_FAILED: invalid credentials",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError"))),
                    @ApiResponse(responseCode = "403", description = "CSRF_INVALID: missing or invalid CSRF token",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError"))),
                    @ApiResponse(responseCode = "500", description = "INTERNAL_ERROR: authentication service unavailable",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError")))
            })
    public void login(@Valid @RequestBody LoginRequest credentials,
            HttpServletRequest request, HttpServletResponse response) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        credentials.username(), credentials.password()));
        sessionAuthentication.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContexts.saveContext(context, request, response);
    }

    @GetMapping("/session")
    @Operation(summary = "Get the current enabled user's public identity",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Current user",
                            content = @Content(mediaType = "application/json", schema = @Schema(implementation = SessionUser.class))),
                    @ApiResponse(responseCode = "401", description = "AUTHENTICATION_REQUIRED or AUTHENTICATION_FAILED",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError"))),
                    @ApiResponse(responseCode = "500", description = "INTERNAL_ERROR",
                            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError")))
            })
    public SessionUser session(@Parameter(hidden = true) Authentication authentication) {
        var user = users.findByUsername(authentication.getName())
                .filter(candidate -> candidate.isEnabled())
                .orElseThrow(() -> new BadCredentialsException("Session user is no longer available"));
        return new SessionUser(user.getId().toString(), user.getDisplayName(), user.getEmail());
    }

    public record LoginRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(max = 72) @Schema(format = "password", accessMode = Schema.AccessMode.WRITE_ONLY) String password) {
    }

    public record CsrfResponse(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String headerName,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String token) {
    }

    public record SessionUser(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "uuid") String id,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String displayName,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "email") String email) {
    }
}
