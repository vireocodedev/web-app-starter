package com.vireocode.backend.reference;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import com.vireocode.backend.TestcontainersConfiguration;
import com.vireocode.backend.user.AppUser;
import com.vireocode.backend.user.AppUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import referencefixtures.config.ReferenceFeatureConfiguration;
import referencefixtures.contacts.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("local")
@Import({
    TestcontainersConfiguration.class, ReferenceFeatureConfiguration.class, ReferenceTestSupport.PersistenceConfiguration.class
})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.bootstrap-user.username=reference-user", "app.bootstrap-user.password=reference-user-password",
    "app.bootstrap-user.email=reference@example.com", "app.bootstrap-user.display-name=Reference User",
    "spring.flyway.locations=classpath:db/migration,classpath:reference-feature/db/migration",
    "spring.jpa.properties.hibernate.generate_statistics=true"
})
public abstract class ReferenceTestSupport {
    protected static final String ACTOR = "reference-user";
    @Autowired protected ContactGroupService groups;
    @Autowired protected ContactService contacts;
    @Autowired protected ContactGroupRepository groupRows;
    @Autowired protected ContactRepository contactRows;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected EntityManager entities;
    @Autowired protected EntityManagerFactory entityFactory;
    @Autowired protected PlatformTransactionManager transactions;
    @Autowired protected Environment environment;
    @Autowired protected ObjectMapper json;
    @Autowired protected ReferenceClock clock;
    protected HttpClient client;
    protected String baseUrl;
    protected String csrfHeader;
    protected String csrfToken;
    @BeforeEach
    protected void referenceSetup() {
        // Each reference context owns a disposable database. No test-wide transaction hides commits.
        jdbc.update("delete from template_reference_contact");
        jdbc.update("delete from template_reference_contact_group");
        clock.set(Instant.parse("2026-01-01T00:00:00Z"));
        client = HttpClient.newBuilder().cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();
        baseUrl = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port") + "/api";
    }

    protected TransactionTemplate tx() {
        return new TransactionTemplate(transactions);
    }

    protected ContactGroupResponse group() {
        return groups.create(ACTOR, new ContactGroupRequest("Partners"));
    }

    protected ContactResponse contact(UUID group, String code) {
        return contacts.create(ACTOR, group, new ContactRequest(code, "Contact " + code, "Initial note"));
    }

    protected void login() throws Exception {
        csrf();
        assertThat(send("POST", "/auth/login", json.writeValueAsString(Map.of(
        "username", ACTOR, "password", "reference-user-password")), null, true).statusCode()).isEqualTo(204);
        csrf();
    }

    protected void csrf() throws Exception {
        var body = tree(send("GET", "/auth/csrf", null, null, false));
        csrfHeader = body.path("headerName").asString();
        csrfToken = body.path("token").asString();
    }

    protected HttpResponse<String> send(String method, String path, String body, String version, boolean withCsrf) throws Exception {
        var request = HttpRequest.newBuilder(URI.create(baseUrl + path));
        if (body != null) request.header("Content-Type", "application/json");
        if (version != null) request.header("X-Expected-Version", version);
        if (withCsrf) request.header(csrfHeader, csrfToken);
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    protected JsonNode tree(HttpResponse<String> response) {
        return json.readTree(response.body());
    }

    protected void error(HttpResponse<String> response, int status, String code) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        var payload = tree(response);
        assertThat(payload.properties()).hasSize(3);
        assertThat(payload.path("code").asString()).isEqualTo(code);
        assertThat(payload.path("fieldErrors").isArray()).isTrue();
        assertThat(response.body()).doesNotContain("template_reference_", "ConstraintViolation", "select ", "private-secret");
    }

    @TestConfiguration(proxyBeanMethods = false)
    @EntityScan(basePackageClasses = {
        AppUser.class, Contact.class
    })
    @EnableJpaRepositories(basePackageClasses = {
        AppUserRepository.class, ContactRepository.class
    })
    public static class PersistenceConfiguration {
        @Bean @Primary ReferenceClock referenceClock() {
            return new ReferenceClock();
        }
    }

    public static final class ReferenceClock extends Clock {
        private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-01-01T00:00:00Z"));
        public void set(Instant instant) {
            now.set(instant);
        }

        @Override public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override public Clock withZone(ZoneId zone) {
            return Clock.fixed(instant(), zone);
        }

        @Override public Instant instant() {
            return now.get();
        }
    }
}
