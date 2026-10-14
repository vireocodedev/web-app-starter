package com.vireocode.backend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.fail;

class CIProtectionProofTests {

    @Test
    void requiredGateBlocksThisControlledFailure() {
        fail("Controlled branch-protection fixture; never merge this test.");
    }
}
