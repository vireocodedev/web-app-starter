package com.vireocode.backend.crud;

import java.time.Clock;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Small mechanics only: concrete public service actions own scope, locks and transactions. */
public abstract class BaseService<E extends BaseEntity> {

    private final JpaRepository<E, UUID> repository;
    private final DeleteMode deleteMode;
    private final Clock clock;

    protected BaseService(Class<E> entityType, JpaRepository<E, UUID> repository, Clock clock) {
        this(entityType, repository, DeleteMode.HARD, clock);
    }

    protected BaseService(Class<E> entityType, JpaRepository<E, UUID> repository,
                          DeleteMode deleteMode, Clock clock) {
        Objects.requireNonNull(entityType, "entityType");
        this.repository = Objects.requireNonNull(repository, "repository");
        this.deleteMode = Objects.requireNonNull(deleteMode, "deleteMode");
        this.clock = Objects.requireNonNull(clock, "clock");
        if (deleteMode == DeleteMode.SOFT && !SoftDeletableEntity.class.isAssignableFrom(entityType)) {
            throw new IllegalArgumentException("SOFT deletion requires SoftDeletableEntity");
        }
    }

    protected final E requireActive(Supplier<Optional<E>> scopedLookup) {
        E entity = Objects.requireNonNull(scopedLookup, "scopedLookup")
            .get().orElseThrow(ResourceNotFoundException::new);
        // SQL restrictions do not hide an already-managed object in the same context.
        if (entity instanceof SoftDeletableEntity retained && retained.getDeletedAt() != null) {
            throw new ResourceNotFoundException();
        }
        return entity;
    }

    protected final void requireExpectedVersion(E entity, long expectedVersion) {
        Objects.requireNonNull(entity, "entity");
        if (expectedVersion < 0) {
            throw new IllegalArgumentException("Expected version must be nonnegative");
        }
        if (!Long.valueOf(expectedVersion).equals(entity.getVersion())) {
            throw new VersionConflictException();
        }
    }

    /** Caller must supply an active managed entity and flush inside its transaction. */
    protected final void deleteManaged(E entity, long expectedVersion) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            throw new IllegalStateException("Deletion requires a writable service transaction");
        }
        E active = requireActive(() -> Optional.of(Objects.requireNonNull(entity, "entity")));
        requireExpectedVersion(active, expectedVersion);
        if (deleteMode == DeleteMode.SOFT) {
            ((SoftDeletableEntity) active).markDeleted(clock.instant());
        } else {
            repository.delete(active);
        }
    }
}
