package com.vireocode.backend.http;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiProfileConfigurationTests {

    @Test
    void baseConfigurationDisablesBothDocumentationSurfaces() {
        configurations().run(context -> {
            assertThat(context.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
            assertThat(context.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
        });
    }

    @Test
    void provisioningExplicitlyDisablesDocumentationEvenWithLocalConfigurationPresent() {
        configurations().withPropertyValues("spring.profiles.active=local,provision-user").run(context -> {
            assertThat(context.getEnvironment().getProperty("springdoc.api-docs.enabled", Boolean.class)).isFalse();
            assertThat(context.getEnvironment().getProperty("springdoc.swagger-ui.enabled", Boolean.class)).isFalse();
        });
    }

    private ApplicationContextRunner configurations() {
        return new ApplicationContextRunner().withInitializer(new ConfigDataApplicationContextInitializer());
    }
}
