package com.vireocode.backend.user;

import java.util.Optional;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProvisionUserRunnerTests {

    final AppUserRepository users = mock(AppUserRepository.class);
    final PasswordEncoder encoder = mock(PasswordEncoder.class);
    final ValidatorFactory validation = Validation.buildDefaultValidatorFactory();
    final MockEnvironment environment = new MockEnvironment()
            .withProperty("PROVISION_USER_USERNAME", "operator")
            .withProperty("PROVISION_USER_EMAIL", "operator@example.com")
            .withProperty("PROVISION_USER_DISPLAY_NAME", "Operator")
            .withProperty("PROVISION_USER_PASSWORD", "fixture-password");
    final ProvisionUserRunner runner = new ProvisionUserRunner(users, encoder, environment, validation.getValidator());
    final DefaultApplicationArguments arguments = new DefaultApplicationArguments("--provision-user");

    @AfterEach
    void closeValidator() {
        validation.close();
    }

    @Test
    void createsOnlyHashedCredentials() {
        when(encoder.encode("fixture-password")).thenReturn("encoded");
        runner.run(arguments);
        var captured = org.mockito.ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(captured.capture());
        var user = captured.getValue();
        assertThat(user.getUsername()).isEqualTo("operator");
        assertThat(user.getEmail()).isEqualTo("operator@example.com");
        assertThat(user.getDisplayName()).isEqualTo("Operator");
        assertThat(user.getPasswordHash()).isEqualTo("encoded");
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void matchingRepeatDoesNotSaveOrRehash() {
        var existing = new AppUser("operator", "encoded", "Operator", "operator@example.com");
        when(users.findByUsername("operator")).thenReturn(Optional.of(existing));
        when(encoder.matches("fixture-password", "encoded")).thenReturn(true);
        runner.run(arguments);
        verify(users, never()).save(any());
        verify(encoder, never()).encode(any());
    }

    @Test
    void differentExistingCredentialsAreRejectedWithoutResettingUser() {
        var existing = new AppUser("operator", "encoded", "Operator", "operator@example.com");
        when(users.findByUsername("operator")).thenReturn(Optional.of(existing));
        when(encoder.matches("fixture-password", "encoded")).thenReturn(false);
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("no changes made");
        verify(users, never()).save(any());
    }

    @Test
    void differentExistingIdentityAndDisabledAccountsAreNeverModified() {
        when(users.findByUsername("operator")).thenReturn(Optional.of(
                new AppUser("operator", "encoded", "Someone Else", "different@example.com")));
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("no changes made");
        var disabled = mock(AppUser.class);
        when(disabled.isEnabled()).thenReturn(false);
        when(users.findByUsername("operator")).thenReturn(Optional.of(disabled));
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("no changes made");
        verify(users, never()).save(any());
        verify(encoder, never()).encode(any());
    }

    @Test
    void invalidInputReportsFieldsWithoutRevealingValues() {
        environment.withProperty("PROVISION_USER_PASSWORD", "secret");
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("password")
                .hasMessageNotContaining("secret");
        verify(users, never()).findByUsername(any());
        environment.withProperty("PROVISION_USER_PASSWORD", "\u00e9".repeat(40));
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("72 UTF-8 bytes");
        verify(users, never()).save(any());
    }

    @Test
    void missingInputDoesNotFallBackToLocalCredentials() {
        environment.getPropertySources().remove("mockProperties");
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("Invalid one-time provisioning fields");
        verify(users, never()).findByUsername(any());
    }

    @Test
    void profileAloneAndLocalProfileAreRejected() {
        assertThatThrownBy(() -> runner.run(new DefaultApplicationArguments()))
                .hasMessageContaining("explicit --provision-user");
        environment.setActiveProfiles("local", "provision-user");
        assertThatThrownBy(() -> runner.run(arguments)).hasMessageContaining("cannot use the local profile");
        verify(users, never()).findByUsername(any());
    }

    @Test
    void combinedProfileCannotRunTheLocalInitializerBeforeRejection() {
        new ApplicationContextRunner()
                .withPropertyValues("spring.profiles.active=local,provision-user")
                .withUserConfiguration(LocalUserInitializer.class)
                .run(context -> assertThat(context.getBeansOfType(LocalUserInitializer.class)).isEmpty());
    }
}
