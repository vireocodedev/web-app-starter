package com.vireocode.backend.user;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@EnableConfigurationProperties(LocalUserProperties.class)
public class LocalUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalUserInitializer.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final LocalUserProperties properties;

    public LocalUserInitializer(AppUserRepository users, PasswordEncoder passwordEncoder,
            LocalUserProperties properties) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (properties.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("INITIAL_USER_PASSWORD must be at most 72 UTF-8 bytes.");
        }
        if (users.findByUsername(properties.username()).isPresent()) {
            log.info("Local initial user already exists; its credentials were not changed.");
            return;
        }
        users.save(new AppUser(properties.username(), passwordEncoder.encode(properties.password()),
                properties.displayName(), properties.email()));
        log.info("Created the local initial user.");
    }
}
