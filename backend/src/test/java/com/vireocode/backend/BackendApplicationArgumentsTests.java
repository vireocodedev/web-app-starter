package com.vireocode.backend;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BackendApplicationArgumentsTests {

    @Test
    void normalStartupDoesNotEnterProvisioningMode() {
        assertThat(BackendApplication.provisioningRequested(new String[0])).isFalse();
        assertThat(BackendApplication.provisioningRequested(new String[]{"--server.port=0"})).isFalse();
    }

    @Test
    void explicitFlagEntersProvisioningMode() {
        assertThat(BackendApplication.provisioningRequested(new String[]{"--provision-user"})).isTrue();
    }

    @Test
    void flagWithValueIsRejectedRatherThanSilentlyProvisioning() {
        assertThatThrownBy(() -> BackendApplication.provisioningRequested(new String[]{"--provision-user=false"}))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("without a value");
    }
}
