package com.vireocode.backend.user;

import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("provision-user")
public class ProvisionUserRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProvisionUserRunner.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;
    private final Validator validator;

    public ProvisionUserRunner(AppUserRepository users, PasswordEncoder passwordEncoder,
            Environment environment, Validator validator) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
        this.validator = validator;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!args.containsOption("provision-user") || !args.getOptionValues("provision-user").isEmpty()) {
            throw new IllegalStateException("User provisioning requires the explicit --provision-user flag.");
        }
        if (environment.acceptsProfiles(Profiles.of("local"))) {
            throw new IllegalStateException("One-time user provisioning cannot use the local profile.");
        }
        var properties = new LocalUserProperties(
                environment.getProperty("PROVISION_USER_USERNAME"),
                environment.getProperty("PROVISION_USER_EMAIL"),
                environment.getProperty("PROVISION_USER_DISPLAY_NAME"),
                environment.getProperty("PROVISION_USER_PASSWORD"));
        var violations = validator.validate(properties);
        if (!violations.isEmpty()) {
            var fields = violations.stream().map(value -> value.getPropertyPath().toString())
                    .distinct().sorted().collect(Collectors.joining(", "));
            throw new IllegalStateException("Invalid one-time provisioning fields: " + fields);
        }
        if (properties.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("PROVISION_USER_PASSWORD must be at most 72 UTF-8 bytes.");
        }
        var existing = users.findByUsername(properties.username());
        if (existing.isPresent()) {
            var user = existing.orElseThrow();
            if (!user.isEnabled() || !user.getEmail().equals(properties.email())
                    || !user.getDisplayName().equals(properties.displayName())
                    || !passwordEncoder.matches(properties.password(), user.getPasswordHash())) {
                throw new IllegalStateException("Existing user does not match provisioning settings; no changes made.");
            }
            log.info("Provisioned user already exists with matching settings; no changes made.");
            return;
        }
        users.save(new AppUser(properties.username(), passwordEncoder.encode(properties.password()),
                properties.displayName(), properties.email()));
        log.info("Created the one-time provisioned user.");
    }
}
