package com.vireocode.backend.auth;

import java.util.List;

import com.vireocode.backend.http.ApiErrors;
import com.vireocode.backend.user.AppUserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

@Configuration(proxyBeanMethods = false)
public class SecurityConfiguration {

    static final String LOGOUT_PATH = "/auth/logout";

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    UserDetailsService userDetailsService(AppUserRepository users) {
        return username -> {
            var user = users.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
            return User.withUsername(user.getUsername())
                    .password(user.getPasswordHash())
                    .disabled(!user.isEnabled())
                    .roles("USER")
                    .build();
        };
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder passwordEncoder) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    CsrfTokenRepository csrfTokenRepository() {
        return new HttpSessionCsrfTokenRepository();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SessionAuthenticationStrategy sessionAuthenticationStrategy(CsrfTokenRepository csrfTokens) {
        return new CompositeSessionAuthenticationStrategy(List.of(
                new ChangeSessionIdAuthenticationStrategy(),
                new CsrfAuthenticationStrategy(csrfTokens)));
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, CsrfTokenRepository csrfTokens,
            SecurityContextRepository securityContexts, ApiErrors errors, Environment environment) throws Exception {
        var properties = Binder.get(environment);
        boolean apiDocsEnabled = properties.bind("springdoc.api-docs.enabled", Boolean.class).orElse(false);
        boolean swaggerUiEnabled = properties.bind("springdoc.swagger-ui.enabled", Boolean.class).orElse(false);
        return http
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens))
                .securityContext(context -> context.securityContextRepository(securityContexts))
                .requestCache(cache -> cache.disable())
                .authorizeHttpRequests(requests -> {
                    requests.requestMatchers("/auth/csrf", "/auth/login", "/actuator/health", "/error").permitAll();
                    if (apiDocsEnabled) {
                        requests.requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs.yaml").permitAll();
                        requests.requestMatchers(HttpMethod.HEAD, "/v3/api-docs", "/v3/api-docs.yaml").permitAll();
                    }
                    if (swaggerUiEnabled) {
                        requests.requestMatchers(HttpMethod.GET, "/swagger-ui.html", "/swagger-ui/**",
                                "/v3/api-docs/swagger-config").permitAll();
                        requests.requestMatchers(HttpMethod.HEAD, "/swagger-ui.html", "/swagger-ui/**",
                                "/v3/api-docs/swagger-config").permitAll();
                    }
                    requests.anyRequest().authenticated();
                })
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                errors.writeAuthenticationRequired(response))
                        .accessDeniedHandler((request, response, exception) ->
                                errors.writeAccessDenied(response, exception instanceof CsrfException)))
                .logout(logout -> logout
                        .logoutUrl(LOGOUT_PATH)
                        .deleteCookies("SESSION")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .build();
    }
}
