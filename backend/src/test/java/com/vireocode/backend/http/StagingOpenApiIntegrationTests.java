package com.vireocode.backend.http;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.vireocode.backend.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.test.context.ContextConfiguration;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@ContextConfiguration(initializers = StagingOpenApiIntegrationTests.StagingEnvironment.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.application.name=consumer-staging-backend")
class StagingOpenApiIntegrationTests {

    @Autowired
    Environment environment;

    @Autowired
    ObjectMapper json;

    @Test
    void canonicalDeploymentEnvironmentEnablesAnonymousSchemaAndUiWithoutTheLocalProfile() throws Exception {
        assertThat(environment.getActiveProfiles()).doesNotContain("local");
        assertThat(environment.getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
        assertThat(Binder.get(environment).bind("springdoc.api-docs.enabled", Boolean.class).orElse(false)).isTrue();
        assertThat(Binder.get(environment).bind("springdoc.swagger-ui.enabled", Boolean.class).orElse(false)).isTrue();
        var response = get("/v3/api-docs");
        assertThat(response.statusCode()).isEqualTo(200);
        var api = json.readTree(response.body());
        assertThat(api.path("info").path("title").asString()).isEqualTo("consumer-staging-backend API");
        assertThat(api.path("paths").has("/auth/login")).isTrue();
        assertThat(api.path("paths").has("/auth/logout")).isTrue();
        assertThat(get("/v3/api-docs.yaml").statusCode()).isEqualTo(200);
        assertThat(get("/v3/api-docs/swagger-config").statusCode()).isEqualTo(200);
        assertThat(get("/swagger-ui.html").statusCode()).isEqualTo(302);
        assertThat(get("/swagger-ui/index.html").statusCode()).isEqualTo(200);
        assertThat(get("/swagger-ui/swagger-ui-bundle.js").statusCode()).isEqualTo(200);
        assertThat(get("/auth/session").statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> get(String path) throws Exception {
        var url = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port") + "/api" + path;
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(url)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    static class StagingEnvironment implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            Map<String, Object> flags = Map.of(
                    "SPRINGDOC_APIDOCS_ENABLED", "true",
                    "SPRINGDOC_SWAGGERUI_ENABLED", "true");
            context.getEnvironment().getPropertySources().addFirst(
                    new SystemEnvironmentPropertySource("staging-systemEnvironment", flags));
        }
    }
}
