package com.vireocode.backend;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import com.vireocode.backend.user.AppUserRepository;
import com.vireocode.backend.user.LocalUserInitializer;
import httptestfixtures.HttpErrorTestConfiguration;
import httptestfixtures.OpenApiTestConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("local")
@Import({TestcontainersConfiguration.class, HttpErrorTestConfiguration.class, OpenApiTestConfiguration.class})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "app.bootstrap-user.username=test-user",
        "app.bootstrap-user.password=test-user-password",
        "app.bootstrap-user.email=test@example.com",
        "app.bootstrap-user.display-name=Test User"
})
class AuthIntegrationTests {

    @Autowired
    Environment environment;

    @Autowired
    ObjectMapper json;

    @Autowired
    AppUserRepository users;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    LocalUserInitializer initializer;

    @Autowired
    JdbcTemplate jdbc;

    CookieManager cookies;
    HttpClient client;
    String baseUrl;

    @BeforeEach
    void setUp() {
        cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        client = HttpClient.newBuilder().cookieHandler(cookies).build();
        baseUrl = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port") + "/api";
    }

    @Test
    void anonymousSessionIs401AndHealthIsPublic() throws Exception {
        assertError(get("/auth/session"), 401, "AUTHENTICATION_REQUIRED", "Authentication required");
        assertThat(get("/actuator/health").statusCode()).isEqualTo(200);
    }

    @Test
    void loginSessionAndLogoutMatchTheFrontendContract() throws Exception {
        var csrf = csrf();
        var anonymousSessionId = sessionId();
        assertThat(post("/auth/login", credentials("test-user-password"), csrf).statusCode()).isEqualTo(204);
        assertThat(sessionId()).isNotEqualTo(anonymousSessionId);

        var session = get("/auth/session");
        assertThat(session.statusCode()).isEqualTo(200);
        assertThat(json.readTree(session.body()).properties()).hasSize(3);
        assertThat(json.readTree(session.body()).get("id").asString())
                .isEqualTo(users.findByUsername("test-user").orElseThrow().getId().toString());
        assertThat(json.readTree(session.body()).get("displayName").asString()).isEqualTo("Test User");
        assertThat(json.readTree(session.body()).get("email").asString()).isEqualTo("test@example.com");
        assertThat(jdbc.queryForObject(
                "select count(*) from spring_session where principal_name = 'test-user'", Integer.class))
                .isGreaterThanOrEqualTo(1);

        assertThat(post("/auth/logout", "", csrf()).statusCode()).isEqualTo(204);
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
    }

    @Test
    void passwordsAreHashedAndLocalInitializationIsIdempotent() {
        var user = users.findByUsername("test-user").orElseThrow();
        assertThat(user.getPasswordHash()).isNotEqualTo("test-user-password");
        assertThat(passwordEncoder.matches("test-user-password", user.getPasswordHash())).isTrue();
        initializer.run(new DefaultApplicationArguments(new String[0]));
        assertThat(users.count()).isEqualTo(1);
        assertThat(users.findByUsername("test-user").orElseThrow().getPasswordHash())
                .isEqualTo(user.getPasswordHash());
    }

    @Test
    void invalidCredentialsAre401WithoutStartingAuthentication() throws Exception {
        var csrf = csrf();
        var wrongPassword = post("/auth/login", credentials("wrong-password"), csrf);
        var unknownUser = post("/auth/login", "{\"username\":\"unknown\",\"password\":\"wrong-password\"}", csrf);
        assertError(wrongPassword, 401, "AUTHENTICATION_FAILED", "Invalid credentials or expired session");
        assertError(unknownUser, 401, "AUTHENTICATION_FAILED", "Invalid credentials or expired session");
        assertThat(unknownUser.body()).isEqualTo(wrongPassword.body());
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
    }

    @Test
    void authenticationServiceOutagesAreSafeServerErrorsInsteadOfInvalidCredentials() throws Exception {
        var csrf = csrf();
        for (var username : List.of("test-authentication-outage", "test-internal-authentication-outage")) {
            assertError(post("/auth/login", json.writeValueAsString(Map.of(
                    "username", username, "password", "private-submitted-password")), csrf),
                    500, "INTERNAL_ERROR", "The request could not be completed");
        }
        assertError(get("/auth/session"), 401, "AUTHENTICATION_REQUIRED", "Authentication required");
        assertError(post("/auth/login", credentials("wrong-password"), csrf),
                401, "AUTHENTICATION_FAILED", "Invalid credentials or expired session");
        assertError(post("/auth/login", json.writeValueAsString(Map.of(
                "username", "unknown-user", "password", "wrong-password")), csrf),
                401, "AUTHENTICATION_FAILED", "Invalid credentials or expired session");
    }

    @Test
    void unavailableSessionUserUsesTheSameSafeAuthenticationFailure() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        jdbc.update("update app_user set enabled = false where username = ?", "test-user");
        try {
            assertError(get("/auth/session"), 401, "AUTHENTICATION_FAILED", "Invalid credentials or expired session");
        } finally {
            jdbc.update("update app_user set enabled = true where username = ?", "test-user");
        }
    }

    @Test
    void loginAndLogoutRequireCsrfEvenForAnonymousRequests() throws Exception {
        assertError(post("/auth/login", credentials("test-user-password"), null),
                403, "CSRF_INVALID", "Request not permitted");
        assertError(post("/auth/logout", "", null), 403, "CSRF_INVALID", "Request not permitted");
    }

    @Test
    void csrfTokenIsBoundToItsSession() throws Exception {
        var csrf = csrf();
        cookies.getCookieStore().removeAll();
        assertError(post("/auth/login", credentials("test-user-password"), csrf),
                403, "CSRF_INVALID", "Request not permitted");
    }

    @Test
    void loginRotatesCsrfAndLogoutInvalidatesThePersistedSession() throws Exception {
        var oldToken = csrf();
        assertThat(post("/auth/login", credentials("test-user-password"), oldToken).statusCode()).isEqualTo(204);
        var authenticatedSessionId = sessionId();
        assertError(post("/auth/logout", "", oldToken), 403, "CSRF_INVALID", "Request not permitted");
        assertThat(get("/auth/session").statusCode()).isEqualTo(200);
        assertThat(post("/auth/logout", "", csrf()).statusCode()).isEqualTo(204);

        var replay = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/auth/session"))
                        .header("Cookie", "SESSION=" + authenticatedSessionId).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(replay.statusCode()).isEqualTo(401);
    }

    @Test
    void loginValidationPublishesOnlyBoundedFieldCodes() throws Exception {
        var csrf = csrf();
        assertValidation(post("/auth/login", "{}", csrf), List.of(
                Map.of("field", "username", "code", "REQUIRED"),
                Map.of("field", "password", "code", "REQUIRED")));
        assertValidation(post("/auth/login", "{\"username\":\"test-user\"}", csrf), List.of(
                Map.of("field", "password", "code", "REQUIRED")));
        assertValidation(post("/auth/login", json.writeValueAsString(Map.of(
                "username", " ", "password", " ")), csrf), List.of(
                Map.of("field", "username", "code", "REQUIRED"),
                Map.of("field", "password", "code", "REQUIRED")));
        assertValidation(post("/auth/login", json.writeValueAsString(Map.of(
                "username", "private-username-".repeat(10), "password", "secret-password-".repeat(10))), csrf), List.of(
                Map.of("field", "username", "code", "TOO_LONG"),
                Map.of("field", "password", "code", "TOO_LONG")));
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
    }

    @Test
    void malformedAndAbsentBodiesHaveSafeInvalidRequestResponses() throws Exception {
        var csrf = csrf();
        for (var body : List.of("not-json secret-password", "", "null",
                "{\"username\":{\"private\":\"secret-password\"},\"password\":\"secret-password\"}")) {
            assertError(post("/auth/login", body, csrf), 400, "INVALID_REQUEST", "The request is not valid");
        }
    }

    @Test
    void frameworkErrorsPreserveStatusAndHeadersWithoutPublishingFrameworkBodies() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        var methodNotAllowed = get("/auth/login");
        assertError(methodNotAllowed, 405, "REQUEST_REJECTED", "The request was rejected");
        assertThat(methodNotAllowed.headers().firstValue("Allow").orElseThrow()).contains("POST");

        var unsupportedType = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/auth/login"))
                .header("Content-Type", "text/plain")
                .header("X-CSRF-TOKEN", csrf().token())
                .POST(HttpRequest.BodyPublishers.ofString("secret-password")).build(),
                HttpResponse.BodyHandlers.ofString());
        assertError(unsupportedType, 415, "REQUEST_REJECTED", "The request was rejected");
        assertError(get("/no-such-private-route?secret=private"), 404, "REQUEST_REJECTED", "The request was rejected");
        var unavailable = get("/test-errors/unavailable");
        assertError(unavailable, 503, "INTERNAL_ERROR", "The request could not be completed");
        assertThat(unavailable.headers().firstValue("Retry-After")).contains("30");
        assertError(get("/test-errors/forbidden"), 403, "FORBIDDEN", "Request not permitted");
        assertError(get("/test-errors/authentication"), 401, "AUTHENTICATION_REQUIRED", "Authentication required");
        assertError(get("/test-errors/authentication-service"), 500,
                "INTERNAL_ERROR", "The request could not be completed");

        var unsupportedAccept = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/auth/csrf"))
                .header("Accept", "text/html").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertError(unsupportedAccept, 406, "REQUEST_REJECTED", "The request was rejected");
    }

    @Test
    void declaredExceptionStatusesSurviveSafeTranslationAndCyclicCausesTerminate() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        for (var path : List.of("declared-conflict", "inherited-conflict", "composed-conflict", "wrapped-conflict")) {
            assertError(get("/test-errors/" + path), 409, "REQUEST_REJECTED", "The request was rejected");
        }
        assertError(get("/test-errors/cyclic-causes"), 500, "INTERNAL_ERROR", "The request could not be completed");
    }

    @Test
    void unexpectedAndServletErrorsDoNotExposeSecretsEvenToHtmlClients() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        assertError(get("/test-errors/unexpected"), 500, "INTERNAL_ERROR", "The request could not be completed");
        var servletError = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/test-errors/servlet"))
                .header("Accept", "text/html").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertError(servletError, 502, "INTERNAL_ERROR", "The request could not be completed");
        assertError(get("/error?message=true&trace=true"), 500, "INTERNAL_ERROR", "The request could not be completed");
    }

    @Test
    void persistenceErrorsTranslateOnlyKnownPublicMeaning() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        assertError(get("/test-errors/optimistic-commit"), 409, "VERSION_CONFLICT", "The resource has changed");
        assertError(get("/test-errors/unknown-integrity"), 500, "INTERNAL_ERROR", "The request could not be completed");
    }

    @Test
    void methodValidationKeepsInputAndReturnValueFailuresDistinct() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), csrf()).statusCode()).isEqualTo(204);
        assertError(get("/test-errors/validation?name=private-name"), 400,
                "VALIDATION_FAILED", "Some fields need attention");
        assertError(get("/test-errors/return-validation"), 500,
                "INTERNAL_ERROR", "The request could not be completed");
    }

    @Test
    void cookiesAreHttpOnlyAndSessionResponsesAreNotCacheable() throws Exception {
        var response = get("/auth/csrf");
        assertThat(response.headers().firstValue("Set-Cookie").orElseThrow())
                .contains("HttpOnly", "SameSite=Lax", "Path=/api");
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
    }

    @Test
    void localOpenApiDescribesActualAuthDtosErrorsAndNewControllers() throws Exception {
        var response = get("/v3/api-docs");
        assertThat(response.statusCode()).isEqualTo(200);
        var api = json.readTree(response.body());
        var paths = api.path("paths");
        assertThat(paths.has("/auth/csrf")).isTrue();
        assertThat(paths.has("/auth/login")).isTrue();
        assertThat(paths.has("/auth/session")).isTrue();
        assertThat(paths.has("/auth/logout")).isTrue();
        assertThat(paths.has("/catalog-items")).isTrue();
        assertThat(paths.has("/error")).isFalse();
        assertThat(paths.has("/actuator/health")).isFalse();
        assertThat(paths.has("/api/auth/session")).isFalse();
        assertThat(api.path("info").path("title").asString())
                .isEqualTo(environment.getRequiredProperty("spring.application.name") + " API");
        assertThat(api.path("servers").get(0).path("url").asString()).endsWith("/api");

        var schemas = api.path("components").path("schemas");
        var login = schemas.path("LoginRequest");
        assertThat(login.path("properties").properties()).hasSize(2);
        assertThat(login.path("required").toString()).contains("username", "password");
        assertThat(login.path("properties").path("username").path("maxLength").asInt()).isEqualTo(100);
        assertThat(login.path("properties").path("password").path("maxLength").asInt()).isEqualTo(72);
        assertThat(login.path("properties").path("password").path("format").asString()).isEqualTo("password");
        assertThat(login.path("properties").path("password").path("writeOnly").asBoolean()).isTrue();
        assertThat(schemas.path("CsrfResponse").path("properties").properties()).hasSize(2);
        assertThat(schemas.path("CsrfResponse").path("properties").has("headerName")).isTrue();
        assertThat(schemas.path("CsrfResponse").path("properties").has("token")).isTrue();
        assertThat(schemas.path("SessionUser").path("properties").properties()).hasSize(3);
        assertThat(schemas.path("SessionUser").path("properties").has("id")).isTrue();
        assertThat(schemas.path("SessionUser").path("properties").has("displayName")).isTrue();
        assertThat(schemas.path("SessionUser").path("properties").has("email")).isTrue();
        assertThat(schemas.path("CreateCatalogItem").path("properties").path("name").path("maxLength").asInt())
                .isEqualTo(60);
        assertThat(schemas.path("CreateCatalogItem").path("required").toString()).contains("name");
        assertThat(schemas.path("CatalogItem").path("properties").has("name")).isTrue();

        var error = schemas.path("ApiError");
        assertThat(error.path("properties").properties()).hasSize(3);
        var actualError = json.readTree(get("/auth/session").body());
        assertThat(actualError.properties()).hasSize(3);
        actualError.properties().forEach(field -> assertThat(error.path("properties").has(field.getKey())).isTrue());
        assertThat(error.path("properties").path("fieldErrors").path("type").asString()).isEqualTo("array");
        assertThat(schemas.path("FieldError").path("properties").properties()).hasSize(2);
        assertThat(schemas.path("FieldError").path("properties").has("field")).isTrue();
        assertThat(schemas.path("FieldError").path("properties").has("code")).isTrue();
        assertThat(paths.path("/auth/login").path("post").path("responses").path("400")
                .path("content").path("application/json").path("schema").path("$ref").asString())
                .isEqualTo("#/components/schemas/ApiError");
        assertThat(response.body()).doesNotContain("passwordHash", "AppUser", "CsrfToken", "principal", "JSESSIONID");
    }

    @Test
    void openApiSecurityMatchesTheSessionAndCsrfLifecycle() throws Exception {
        var api = json.readTree(get("/v3/api-docs").body());
        assertThat(api.path("security").toString()).isEqualTo("[{\"sessionCookie\":[]}]");
        var schemes = api.path("components").path("securitySchemes");
        assertThat(schemes.path("sessionCookie").path("in").asString()).isEqualTo("cookie");
        assertThat(schemes.path("sessionCookie").path("name").asString()).isEqualTo("SESSION");
        assertThat(schemes.path("csrfToken").path("in").asString()).isEqualTo("header");
        assertThat(schemes.path("csrfToken").path("name").asString()).isEqualTo("X-CSRF-TOKEN");
        var paths = api.path("paths");
        assertThat(paths.path("/catalog-items").path("post").path("security").get(0).properties()).hasSize(2);
        assertThat(paths.path("/catalog-items").path("post").path("security").get(0).has("sessionCookie")).isTrue();
        assertThat(paths.path("/catalog-items").path("post").path("security").get(0).has("csrfToken")).isTrue();
        assertThat(paths.path("/auth/csrf").path("get").path("security").toString()).isEqualTo("[]");
        assertThat(paths.path("/auth/csrf").path("get").has("parameters")).isFalse();
        assertThat(paths.path("/auth/session").path("get").has("parameters")).isFalse();
        for (var path : List.of("/auth/login", "/auth/logout")) {
            var operation = paths.path(path).path("post");
            assertThat(operation.path("security").toString()).isEqualTo("[{\"csrfToken\":[]}]");
            assertThat(operation.path("responses").has("204")).isTrue();
            assertThat(operation.path("responses").path("204").has("content")).isFalse();
            assertThat(operation.path("responses").path("403").path("content")
                    .path("application/json").path("schema").path("$ref").asString())
                    .isEqualTo("#/components/schemas/ApiError");
        }
        // The documented filter-owned logout also accepts anonymous sessions with a valid token.
        assertThat(post("/auth/logout", "", csrf()).statusCode()).isEqualTo(204);
    }

    @Test
    void localSwaggerUiAndYamlArePublicButProtectedRoutesRemainProtected() throws Exception {
        var yaml = get("/v3/api-docs.yaml");
        assertThat(yaml.statusCode()).isEqualTo(200);
        assertThat(yaml.body()).contains("openapi:", "/auth/login:", "/auth/logout:");
        var redirect = get("/swagger-ui.html");
        assertThat(redirect.statusCode()).isEqualTo(302);
        assertThat(redirect.headers().firstValue("Location").orElseThrow()).endsWith("/api/swagger-ui/index.html");
        var ui = get("/swagger-ui/index.html");
        assertThat(ui.statusCode()).isEqualTo(200);
        assertThat(ui.body()).contains("swagger-ui-bundle.js");
        assertThat(get("/swagger-ui/swagger-ui-bundle.js").statusCode()).isEqualTo(200);
        var config = json.readTree(get("/v3/api-docs/swagger-config").body());
        assertThat(config.path("url").asString()).isEqualTo("/api/v3/api-docs");
        assertThat(config.path("persistAuthorization").asBoolean()).isFalse();
        assertThat(config.toString()).doesNotContain("petstore.swagger.io", "validator.swagger.io");
        assertError(get("/auth/session"), 401, "AUTHENTICATION_REQUIRED", "Authentication required");
        assertError(post("/v3/api-docs", "{}", null), 403, "CSRF_INVALID", "Request not permitted");
        assertError(get("/v3/api-docs/private-group"), 401, "AUTHENTICATION_REQUIRED", "Authentication required");
    }

    private void assertError(HttpResponse<String> response, int status, String code, String message) throws Exception {
        assertError(response, status, code, message, List.of());
    }

    private void assertValidation(HttpResponse<String> response, List<Map<String, String>> fields) throws Exception {
        assertError(response, 400, "VALIDATION_FAILED", "Some fields need attention", fields);
    }

    private void assertError(HttpResponse<String> response, int status, String code, String message,
            List<Map<String, String>> fields) throws Exception {
        assertThat(response.statusCode()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type").orElseThrow()).startsWith("application/json");
        assertThat(json.readTree(response.body())).isEqualTo(json.readTree(json.writeValueAsString(Map.of(
                "code", code, "message", message, "fieldErrors", fields))));
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(baseUrl + path)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String body, Csrf csrf) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(baseUrl + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (csrf != null) {
            request.header(csrf.headerName(), csrf.token());
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private Csrf csrf() throws Exception {
        var response = get("/auth/csrf");
        assertThat(response.statusCode()).isEqualTo(200);
        var token = json.readTree(response.body());
        return new Csrf(token.get("headerName").asString(), token.get("token").asString());
    }

    private String credentials(String password) {
        return json.writeValueAsString(Map.of("username", "test-user", "password", password));
    }

    private String sessionId() {
        return cookies.getCookieStore().getCookies().stream()
                .filter(cookie -> cookie.getName().equals("SESSION"))
                .findFirst().orElseThrow().getValue();
    }

    private record Csrf(String headerName, String token) {
    }
}
