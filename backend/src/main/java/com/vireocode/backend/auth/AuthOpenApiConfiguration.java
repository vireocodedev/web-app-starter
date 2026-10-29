package com.vireocode.backend.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true")
public class AuthOpenApiConfiguration {

    @Bean
    OpenApiCustomizer sessionAuthenticationDocumentation() {
        return api -> {
            api.getComponents()
                    .addSecuritySchemes("sessionCookie", new SecurityScheme().type(SecurityScheme.Type.APIKEY)
                            .in(SecurityScheme.In.COOKIE).name("SESSION")
                            .description("The browser manages this HttpOnly session cookie; do not paste it into Swagger UI."))
                    .addSecuritySchemes("csrfToken", new SecurityScheme().type(SecurityScheme.Type.APIKEY)
                            .in(SecurityScheme.In.HEADER).name("X-CSRF-TOKEN")
                            .description("GET /auth/csrf, then paste its token into Authorize. After login, GET /auth/csrf again "
                                    + "and replace the token before logout or another mutation."));
            api.setSecurity(List.of(new SecurityRequirement().addList("sessionCookie")));
            var authenticationTag = new Tag().name("Authentication").description(
                    "Use this same browser: execute GET /auth/csrf, authorize csrfToken with the returned token, "
                            + "then POST /auth/login (204). Login rotates the session and CSRF token. Execute GET /auth/csrf "
                            + "again and replace csrfToken in Authorize. GET /auth/session checks identity; POST /auth/logout "
                            + "ends the session. Cookies are handled by the browser, and authorization is not persisted.");
            var tags = api.getTags() == null ? new ArrayList<Tag>() : new ArrayList<>(api.getTags());
            tags.removeIf(tag -> "Authentication".equals(tag.getName()));
            tags.add(authenticationTag);
            api.setTags(tags);
            // The installed filter chain requires both a session and CSRF on other protected mutations.
            api.getPaths().values().forEach(path -> path.readOperationsMap().forEach((method, operation) -> {
                if (operation.getSecurity() == null && Set.of(PathItem.HttpMethod.POST, PathItem.HttpMethod.PUT,
                        PathItem.HttpMethod.PATCH, PathItem.HttpMethod.DELETE).contains(method)) {
                    operation.setSecurity(List.of(new SecurityRequirement()
                            .addList("sessionCookie").addList("csrfToken")));
                }
            }));
            // Logout is a Security filter, not an MVC controller; share its actual configured path.
            api.path(SecurityConfiguration.LOGOUT_PATH, new PathItem().post(new Operation()
                    .operationId("logout").summary("End the current session").tags(List.of("Authentication"))
                    .description("Requires a current session-bound CSRF token, including for an anonymous session. "
                            + "Deletes SESSION and returns no body.")
                    .security(List.of(new SecurityRequirement().addList("csrfToken")))
                    .responses(new ApiResponses()
                            .addApiResponse("204", new ApiResponse().description("Session ended"))
                            .addApiResponse("403", new ApiResponse().description("CSRF_INVALID: missing or invalid CSRF token")
                                    .content(new Content().addMediaType("application/json", new MediaType()
                                            .schema(new Schema<>().$ref("#/components/schemas/ApiError"))))))));
        };
    }
}
