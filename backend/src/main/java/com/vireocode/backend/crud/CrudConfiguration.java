package com.vireocode.backend.crud;

import java.time.Clock;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing(dateTimeProviderRef = "crudDateTimeProvider")
class CrudConfiguration {

    @Bean
    @ConditionalOnMissingBean(Clock.class)
    Clock crudClock() {
        return Clock.systemUTC();
    }

    @Bean
    DateTimeProvider crudDateTimeProvider(Clock clock) {
        return () -> Optional.of(clock.instant());
    }
}
