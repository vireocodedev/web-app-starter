package com.vireocode.backend.http;

import com.vireocode.backend.crud.ResourceInUseException;
import com.vireocode.backend.crud.ResourceNotFoundException;
import com.vireocode.backend.crud.VersionConflictException;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.TransactionSystemException;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class CrudHttpContractTests {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void typedAndCommitTimeFailuresHaveSafeStableEnvelopes() {
        assertError(new ResourceNotFoundException(), 404, "RESOURCE_NOT_FOUND");
        assertError(new ResourceInUseException(), 409, "RESOURCE_IN_USE");
        assertError(new VersionConflictException(), 409, "VERSION_CONFLICT");
        assertError(new ObjectOptimisticLockingFailureException("private.entity", "private-id"), 409, "VERSION_CONFLICT");
        assertError(new TransactionSystemException("private-commit", new OptimisticLockException("private-sql")),
                409, "VERSION_CONFLICT");
    }

    @Test
    void unrelatedIntegrityFailureRemainsServerFailure() {
        assertError(new DataIntegrityViolationException("private-sql"), 500, "INTERNAL_ERROR");
    }

    @Test
    void pageOwnsItsItemsAndValidatesBounds() {
        var source = new ArrayList<>(List.of("a"));
        var page = new PageResponse<>(source, 0, 20, 1);
        source.clear();
        assertThat(page.items()).containsExactly("a");
        assertThatIllegalArgumentException().isThrownBy(() -> new PageResponse<>(List.of(), -1, 20, 0));
        assertThatIllegalArgumentException().isThrownBy(() -> new PageResponse<>(List.of(), 0, 101, 0));
    }

    private void assertError(Exception failure, int status, String code) {
        var result = handler.unexpectedFailure(failure);
        assertThat(result.getStatusCode().value()).isEqualTo(status);
        var body = json.valueToTree(result.getBody());
        assertThat(body.properties().stream().map(java.util.Map.Entry::getKey))
                .containsExactlyInAnyOrder("code", "message", "fieldErrors");
        assertThat(body.path("code").asString()).isEqualTo(code);
        assertThat(body.path("fieldErrors").isArray()).isTrue();
        assertThat(body.path("fieldErrors").size()).isZero();
        assertThat(body.toString()).doesNotContain("private", "constraint", "Exception");
    }
}
