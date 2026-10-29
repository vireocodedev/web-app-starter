package com.vireocode.backend.reference;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.zip.ZipFile;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import com.vireocode.backend.TestcontainersConfiguration;
import static org.assertj.core.api.Assertions.*;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "springdoc.api-docs.enabled=true", "springdoc.swagger-ui.enabled=true"
})
class ReferenceIsolationTests {
    @Autowired EntityManagerFactory entities;
    @Autowired ApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping mappings;
    @Autowired Environment environment;
    @Test
    void ordinaryApplicationHasNoReferenceManagedTypesRepositoriesMappingsTablesOrOpenApiPaths() throws Exception {
        assertThat(entities.getMetamodel().getEntities()).noneMatch(e -> e.getJavaType().getName().startsWith("referencefixtures."));
        assertThat(context.getBeanDefinitionNames()).noneMatch(name -> name.equals("contactRepository") || name.equals("contactGroupRepository"));
        assertThat(mappings.getHandlerMethods().keySet()).noneMatch(mapping -> mapping.toString().contains("/reference/"));
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_schema='public' and table_name like 'template_reference_%'", Integer.class)).isZero();
        var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"
        + environment.getRequiredProperty("local.server.port") + "/api/v3/api-docs")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).doesNotContain("/reference/", "ContactRequest", "ContactResponse");
    }

    @Test
    void exactCandidateBootJarContainsNoReferenceClassesResourcesOrSchema() throws Exception {
        var artifact = System.getProperty("template.reference.bootJar");
        assertThat(artifact).as("Gradle test must build and name the exact bootJar candidate").isNotBlank();
        try (var jar = new ZipFile(Path.of(artifact).toFile())) {
            assertThat(jar.stream().map(entry -> entry.getName()).toList())
            .noneMatch(name -> name.contains("referencefixtures/") || name.contains("reference-feature/")
            || name.contains("template_reference_") || name.contains("/reference/Reference"));
        }
    }
}
