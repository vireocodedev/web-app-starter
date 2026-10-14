package com.vireocode.backend.auth;

import com.vireocode.backend.user.AppUserRepository;
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
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
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
    public SessionUser session(Authentication authentication) {
        var user = users.findByUsername(authentication.getName())
                .filter(candidate -> candidate.isEnabled())
                .orElseThrow(() -> new BadCredentialsException("Session user is no longer available"));
        return new SessionUser(user.getId().toString(), user.getDisplayName(), user.getEmail());
    }

    public record LoginRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(max = 72) String password) {
    }

    public record CsrfResponse(String headerName, String token) {
    }

    public record SessionUser(String id, String displayName, String email) {
    }
}
