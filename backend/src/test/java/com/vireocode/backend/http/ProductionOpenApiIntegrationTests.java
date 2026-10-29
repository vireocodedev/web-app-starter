package com.vireocode.backend.http;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import com.vireocode.backend.TestcontainersConfiguration;
import com.vireocode.backend.user.AppUser;
import com.vireocode.backend.user.AppUserRepository;
import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ContextConfiguration;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@ContextConfiguration(initializers = ProductionOpenApiIntegrationTests.ProductionEnvironment.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductionOpenApiIntegrationTests {

    @Autowired
    Environment environment;

    @Autowired
    ApplicationContext context;

    @Autowired
    ObjectMapper json;

    @Autowired
    AppUserRepository users;

    @Autowired
    PasswordEncoder passwordEncoder;

    final HttpClient client = HttpClient.newHttpClient();

    @Test
    void productionHasNoDocumentationMappingsEvenForAnAuthenticatedSession() throws Exception {
        assertThat(environment.getActiveProfiles()).doesNotContain("local");
        assertThat(environment.getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
        assertThat(context.getBeansOfType(OpenAPI.class)).isEmpty();
        var paths = List.of("/v3/api-docs", "/v3/api-docs.yaml", "/v3/api-docs/swagger-config",
                "/swagger-ui.html", "/swagger-ui/index.html", "/swagger-ui/swagger-ui-bundle.js");
        for (var path : paths) {
            assertThat(get(path, null).statusCode()).isEqualTo(401);
        }
        users.save(new AppUser("production-docs-test", passwordEncoder.encode("fixture-password"),
                "Docs Test", "docs-test@example.com"));
        var csrf = get("/auth/csrf", null);
        assertThat(csrf.statusCode()).isEqualTo(200);
        assertThat(csrf.headers().firstValue("Set-Cookie").orElseThrow()).contains("Secure", "HttpOnly");
        var token = json.readTree(csrf.body());
        // The fixture transports Secure cookies explicitly over loopback HTTP; it does not weaken deployment policy.
        var login = client.send(HttpRequest.newBuilder(uri("/auth/login"))
                .header("Cookie", sessionCookie(csrf))
                .header("Content-Type", "application/json")
                .header(token.path("headerName").asString(), token.path("token").asString())
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of(
                        "username", "production-docs-test", "password", "fixture-password")))).build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(login.statusCode()).isEqualTo(204);
        var authenticatedCookie = sessionCookie(login);
        assertThat(get("/auth/session", authenticatedCookie).statusCode()).isEqualTo(200);
        for (var path : paths) {
            var absent = get(path, authenticatedCookie);
            assertThat(absent.statusCode()).as(path).isEqualTo(404);
            assertThat(json.readTree(absent.body()).path("code").asString()).isEqualTo("REQUEST_REJECTED");
        }
    }

    private HttpResponse<String> get(String path, String cookie) throws Exception {
        var request = HttpRequest.newBuilder(uri(path)).GET();
        if (cookie != null) {
            request.header("Cookie", cookie);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://127.0.0.1:" + environment.getRequiredProperty("local.server.port") + "/api" + path);
    }

    private String sessionCookie(HttpResponse<String> response) {
        return response.headers().allValues("Set-Cookie").stream()
                .filter(cookie -> cookie.startsWith("SESSION="))
                .findFirst().orElseThrow().split(";", 2)[0];
    }

    static class ProductionEnvironment implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            Map<String, Object> flags = Map.of(
                    "SPRINGDOC_APIDOCS_ENABLED", "false",
                    "SPRINGDOC_SWAGGERUI_ENABLED", "false");
            context.getEnvironment().getPropertySources().addFirst(
                    new SystemEnvironmentPropertySource("production-systemEnvironment", flags));
        }
    }
}
