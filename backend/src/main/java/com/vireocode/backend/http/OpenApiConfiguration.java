package com.vireocode.backend.http;

import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true")
public class OpenApiConfiguration {

    @Bean
    OpenAPI backendOpenApi(@Value("${spring.application.name}") String applicationName) {
        // Derive the shared schema from the actual private response, without publishing its Java type.
        var schemas = ModelConverters.getInstance().readAll(ApiErrors.forStatus(HttpStatus.BAD_REQUEST).getClass());
        return new OpenAPI()
                .info(new Info().title(applicationName + " API").version("unversioned"))
                .components(new Components().schemas(schemas));
    }
}
