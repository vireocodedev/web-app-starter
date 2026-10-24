/** Pure templates for the installed Spring Boot/JPA profile. No filesystem writes. */

const javaTypes = { string: "String", integer: "Integer", boolean: "Boolean" };
const sqlTypes = { integer: "INTEGER", boolean: "BOOLEAN" };

function upperFirst(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function snake(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

function sample(field) {
  if (field.type === "integer") return "7";
  if (field.type === "boolean") return "true";
  return JSON.stringify("Example".slice(0, field.maxLength));
}

function createContext(context) {
  const packageName = `${context.javaPackage}.${context.feature.java}`;
  const packagePath = packageName.replaceAll(".", "/");
  return {
    ...context,
    packageName,
    packagePath,
    table: `${context.feature.java}_${snake(context.name.kebab)}`,
    endpoint: `/${context.feature.kebab}/${context.name.kebab}`,
    java(name, content) {
      return { path: `backend/src/main/java/${packagePath}/${name}.java`, content };
    },
    test(name, content, basePackage = false) {
      const path = basePackage ? context.javaPackage.replaceAll(".", "/") : packagePath;
      return { path: `backend/src/test/java/${path}/${name}.java`, content };
    },
  };
}

function renderDto(c, variant = c.variant ?? "request") {
  const response = variant === "response";
  const className = `${c.name.pascal}${response ? "Response" : "Request"}`;
  const constraints = new Set();
  const parameters = c.fields.map(field => {
    const annotations = [];
    if (!response) {
      if (field.required) {
        const constraint = field.type === "string" ? "NotBlank" : "NotNull";
        constraints.add(constraint);
        annotations.push(`@${constraint}`);
      }
      if (field.type === "string") {
        constraints.add("Size");
        annotations.push(`@Size(max = ${field.maxLength})`);
      }
    }
    return `        ${[...annotations, javaTypes[field.type], field.name].join(" ")}`;
  });
  if (response) parameters.unshift("        UUID id");
  const imports = response
    ? "import java.util.UUID;\n"
    : [...constraints]
        .sort()
        .map(name => `import jakarta.validation.constraints.${name};`)
        .join("\n") + "\n";
  return c.java(
    className,
    `package ${c.packageName};

${imports}
/** ${response ? "Explicit public projection; persistence internals remain private." : "Transport validation only; the owning action must enforce domain policy."} */
public record ${className}(
${parameters.join(",\n")}) {
}
`,
  );
}

function renderEntity(c) {
  const n = c.name.pascal;
  const properties = c.fields
    .map(field => {
      const length = field.type === "string" ? `, length = ${field.maxLength}` : "";
      return `    @Column(name = "${snake(field.name)}", nullable = ${!field.required}${length})
    private ${javaTypes[field.type]} ${field.name};`;
    })
    .join("\n\n");
  const argumentsList = c.fields.map(field => `${javaTypes[field.type]} ${field.name}`).join(", ");
  const assignments = c.fields.map(field => `        this.${field.name} = ${field.name};`).join("\n");
  const getters = c.fields
    .map(
      field => `    public ${javaTypes[field.type]} get${upperFirst(field.name)}() {
        return ${field.name};
    }`,
    )
    .join("\n\n");
  return c.java(
    n,
    `package ${c.packageName};

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity(name = "${c.feature.pascal}${n}")
@Table(name = "${c.table}")
public class ${n} {

    @Id
    private UUID id;

${properties}

    protected ${n}() {
    }

    public ${n}(${argumentsList}) {
        this.id = UUID.randomUUID();
${assignments}
    }

    public UUID getId() {
        return id;
    }

${getters}
}
`,
  );
}

function renderMigration(c) {
  if (!Number.isSafeInteger(c.migrationVersion) || c.migrationVersion < 1) {
    throw new Error("A positive explicit migrationVersion is required for persisted domain generation.");
  }
  const columns = c.fields.map(field => {
    const type = field.type === "string" ? `VARCHAR(${field.maxLength})` : sqlTypes[field.type];
    return `    ${snake(field.name)} ${type}${field.required ? " NOT NULL" : ""}`;
  });
  return {
    path: `backend/src/main/resources/db/migration/V${c.migrationVersion}__create_${c.table}.sql`,
    content: `CREATE TABLE ${c.table} (\n    id UUID PRIMARY KEY,\n${columns.join(",\n")}\n);\n`,
  };
}

function renderRepository(c) {
  const n = c.name.pascal;
  return c.java(
    `${n}Repository`,
    `package ${c.packageName};

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("${c.feature.camel}${n}Repository")
public interface ${n}Repository extends JpaRepository<${n}, UUID> {
}
`,
  );
}

function renderService(c) {
  const n = c.name.pascal;
  const values = ["entity.getId()", ...c.fields.map(field => `entity.get${upperFirst(field.name)}()`)].join(", ");
  return c.java(
    `${n}Service`,
    `package ${c.packageName};

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Read-only shared records. Private/tenant records need an approved authority seam. */
@Service("${c.feature.camel}${n}Service")
@Transactional(readOnly = true)
public class ${n}Service {

    private final ${n}Repository records;

    public ${n}Service(${n}Repository records) {
        this.records = records;
    }

    public ${n}Response get(UUID id) {
        var entity = records.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new ${n}Response(${values});
    }
}
`,
  );
}

function renderController(c) {
  const n = c.name.pascal;
  return c.java(
    `${n}Controller`,
    `package ${c.packageName};

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Uses the installed authenticated-session boundary; exposes no mutation endpoint. */
@RestController("${c.feature.camel}${n}Controller")
@RequestMapping("${c.endpoint}")
public class ${n}Controller {

    private final ${n}Service service;

    public ${n}Controller(${n}Service service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ${n}Response get(@PathVariable("id") UUID id) {
        return service.get(id);
    }
}
`,
  );
}

function renderServiceTest(c) {
  const n = c.name.pascal;
  const argumentsList = c.fields.map(sample).join(", ");
  const assertions = c.fields
    .map(field => `        assertThat(result.${field.name}()).isEqualTo(entity.get${upperFirst(field.name)}());`)
    .join("\n");
  return c.test(
    `${n}ServiceTests`,
    `package ${c.packageName};

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ${n}ServiceTests {

    @Test
    void projectsOnlyTheDeclaredResponseFields() {
        var records = mock(${n}Repository.class);
        var entity = new ${n}(${argumentsList});
        when(records.findById(entity.getId())).thenReturn(Optional.of(entity));

        var result = new ${n}Service(records).get(entity.getId());

        assertThat(result.id()).isEqualTo(entity.getId());
${assertions}
    }

    @Test
    void missingRecordsKeepTheirHttpStatus() {
        var records = mock(${n}Repository.class);
        var id = UUID.fromString("00000000-0000-4000-8000-000000000001");
        when(records.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new ${n}Service(records).get(id))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode().value()).isEqualTo(404));
    }
}
`,
  );
}

function renderDtoTest(c) {
  const n = `${c.name.pascal}Request`;
  const sampleValues = c.fields.map(sample);
  const invalidIndex = c.fields.findIndex(field => field.required);
  const invalidValues = [...sampleValues];
  if (invalidIndex >= 0) invalidValues[invalidIndex] = "null";
  const firstStringIndex = c.fields.findIndex(field => field.type === "string");
  const oversizeValues = [...sampleValues];
  if (firstStringIndex >= 0)
    oversizeValues[firstStringIndex] = `"x".repeat(${c.fields[firstStringIndex].maxLength + 1})`;
  const invalidTest =
    invalidIndex < 0
      ? ""
      : `
    @Test
    void missingRequiredValueIsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var request = new ${n}(${invalidValues.join(", ")});
            assertThat(factory.getValidator().validate(request))
                    .anySatisfy(violation -> assertThat(violation.getPropertyPath().toString())
                            .isEqualTo("${c.fields[invalidIndex].name}"));
        }
    }
`;
  const lengthTest =
    firstStringIndex < 0
      ? ""
      : `
    @Test
    void oversizedTextIsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var request = new ${n}(${oversizeValues.join(", ")});
            assertThat(factory.getValidator().validate(request))
                    .anySatisfy(violation -> assertThat(violation.getPropertyPath().toString())
                            .isEqualTo("${c.fields[firstStringIndex].name}"));
        }
    }
`;
  return c.test(
    `${n}Tests`,
    `package ${c.packageName};

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ${n}Tests {

    @Test
    void validTransportInputIsAccepted() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var request = new ${n}(${sampleValues.join(", ")});
            assertThat(factory.getValidator().validate(request)).isEmpty();
        }
    }
${invalidTest}${lengthTest}}
`,
  );
}

function renderIntegrationTest(c) {
  const n = c.name.pascal;
  const className = `${c.feature.pascal}${n}IntegrationTests`;
  const argumentsList = c.fields.map(sample).join(", ");
  const jsonAssertions = c.fields
    .map(field => {
      const reader = field.type === "integer" ? "asInt()" : field.type === "boolean" ? "asBoolean()" : "asString()";
      return `        assertThat(body.get("${field.name}").${reader}).isEqualTo(${sample(field)});`;
    })
    .join("\n");
  return c.test(
    className,
    `package ${c.javaPackage};

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

import ${c.packageName}.${n};
import ${c.packageName}.${n}Repository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

/** Real HTTP/session/JPA/migration fixture; never targets a developer database. */
@ActiveProfiles("local")
@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "app.bootstrap-user.username=generated-test-user",
        "app.bootstrap-user.password=generated-test-password",
        "app.bootstrap-user.email=generated-test@example.com",
        "app.bootstrap-user.display-name=Generated Test User"
})
class ${className} {

    @Autowired
    Environment environment;

    @Autowired
    ObjectMapper json;

    @Autowired
    ${n}Repository records;

    HttpClient client;
    String baseUrl;

    @BeforeEach
    void setUp() {
        var cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        client = HttpClient.newBuilder().cookieHandler(cookies).build();
        baseUrl = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port") + "/api";
    }

    @AfterEach
    void clearOwnedFixture() {
        records.deleteAll();
    }

    @Test
    void anonymousReadsAreDenied() throws Exception {
        var response = get("${c.endpoint}/" + UUID.randomUUID());
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(json.readTree(response.body()).get("code").asString()).isEqualTo("AUTHENTICATION_REQUIRED");
    }

    @Test
    void authenticatedReadUsesTheMigratedTableAndExplicitProjection() throws Exception {
        var entity = records.saveAndFlush(new ${n}(${argumentsList}));
        login();

        var response = get("${c.endpoint}/" + entity.getId());

        assertThat(response.statusCode()).isEqualTo(200);
        var body = json.readTree(response.body());
        assertThat(body.properties()).hasSize(${c.fields.length + 1});
        assertThat(body.get("id").asString()).isEqualTo(entity.getId().toString());
${jsonAssertions}
    }

    @Test
    void missingAndMalformedIdsKeepTheirPublicStatuses() throws Exception {
        login();
        var missing = get("${c.endpoint}/" + UUID.randomUUID());
        assertThat(missing.statusCode()).isEqualTo(404);
        assertThat(json.readTree(missing.body()).get("code").asString()).isEqualTo("REQUEST_REJECTED");
        assertThat(get("${c.endpoint}/invalid-id").statusCode()).isEqualTo(400);
    }

    private void login() throws Exception {
        var csrfResponse = get("/auth/csrf");
        assertThat(csrfResponse.statusCode()).isEqualTo(200);
        var csrf = json.readTree(csrfResponse.body());
        var request = HttpRequest.newBuilder(URI.create(baseUrl + "/auth/login"))
                .header("Content-Type", "application/json")
                .header(csrf.get("headerName").asString(), csrf.get("token").asString())
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of(
                        "username", "generated-test-user", "password", "generated-test-password"))))
                .build();
        assertThat(client.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(204);
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(baseUrl + path)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }
}
`,
    true,
  );
}

/** Callers validate names, options, collisions and existing layer prerequisites first. */
export function renderBackend(kind, context) {
  const c = createContext(context);
  switch (kind) {
    case "dto":
      return (c.variant ?? "request") === "response" ? [renderDto(c)] : [renderDto(c), renderDtoTest(c)];
    case "domain":
      return [renderEntity(c), renderMigration(c)];
    case "repository":
      return [renderRepository(c)];
    case "service":
      return [renderDto(c, "response"), renderService(c), renderServiceTest(c)];
    case "controller":
      return [renderController(c)];
    case "feature":
      return [
        renderEntity(c),
        renderMigration(c),
        renderRepository(c),
        renderDto(c, "response"),
        renderService(c),
        renderController(c),
        renderServiceTest(c),
        renderIntegrationTest(c),
      ];
    default:
      throw new Error(`Unsupported backend generator: ${kind}`);
  }
}

/** Layers intentionally not recreated by a standalone invocation. */
export function backendPrerequisites(kind, context) {
  const c = createContext(context);
  const required =
    {
      repository: [c.name.pascal],
      service: [c.name.pascal, `${c.name.pascal}Repository`],
      controller: [`${c.name.pascal}Service`, `${c.name.pascal}Response`],
    }[kind] ?? [];
  return required.map(name => `backend/src/main/java/${c.packagePath}/${name}.java`);
}
