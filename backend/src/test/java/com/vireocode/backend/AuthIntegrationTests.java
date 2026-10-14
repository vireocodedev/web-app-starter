package com.vireocode.backend;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.vireocode.backend.user.AppUserRepository;
import com.vireocode.backend.user.LocalUserInitializer;
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
@Import(TestcontainersConfiguration.class)
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
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
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
        assertThat(post("/auth/login", credentials("wrong-password"), csrf).statusCode()).isEqualTo(401);
        assertThat(post("/auth/login", "{\"username\":\"unknown\",\"password\":\"wrong-password\"}", csrf)
                .statusCode()).isEqualTo(401);
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
    }

    @Test
    void loginAndLogoutRequireCsrfEvenForAnonymousRequests() throws Exception {
        assertThat(post("/auth/login", credentials("test-user-password"), null).statusCode()).isEqualTo(403);
        assertThat(post("/auth/logout", "", null).statusCode()).isEqualTo(403);
    }

    @Test
    void csrfTokenIsBoundToItsSession() throws Exception {
        var csrf = csrf();
        cookies.getCookieStore().removeAll();
        assertThat(post("/auth/login", credentials("test-user-password"), csrf).statusCode()).isEqualTo(403);
    }

    @Test
    void loginRotatesCsrfAndLogoutInvalidatesThePersistedSession() throws Exception {
        var oldToken = csrf();
        assertThat(post("/auth/login", credentials("test-user-password"), oldToken).statusCode()).isEqualTo(204);
        var authenticatedSessionId = sessionId();
        assertThat(post("/auth/logout", "", oldToken).statusCode()).isEqualTo(403);
        assertThat(get("/auth/session").statusCode()).isEqualTo(200);
        assertThat(post("/auth/logout", "", csrf()).statusCode()).isEqualTo(204);

        var replay = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(baseUrl + "/auth/session"))
                        .header("Cookie", "SESSION=" + authenticatedSessionId).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(replay.statusCode()).isEqualTo(401);
    }

    @Test
    void invalidJsonAndMissingFieldsAre400() throws Exception {
        var csrf = csrf();
        assertThat(post("/auth/login", "{\"username\":\"test-user\"}", csrf).statusCode()).isEqualTo(400);
        assertThat(post("/auth/login", "not-json", csrf).statusCode()).isEqualTo(400);
    }

    @Test
    void cookiesAreHttpOnlyAndSessionResponsesAreNotCacheable() throws Exception {
        var response = get("/auth/csrf");
        assertThat(response.headers().firstValue("Set-Cookie").orElseThrow())
                .contains("HttpOnly", "SameSite=Lax", "Path=/api");
        assertThat(response.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
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
