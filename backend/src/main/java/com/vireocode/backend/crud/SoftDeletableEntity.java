package com.vireocode.backend.crud;

import java.time.Instant;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

/** Optional retained-row capability; each concrete entity declares its active-row restriction. */
@MappedSuperclass
public abstract class SoftDeletableEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected SoftDeletableEntity() {
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    // Virtual so Hibernate proxies delegate mutation to the managed implementation.
    protected void markDeleted(Instant deletedAt) {
        if (this.deletedAt != null) {
            throw new ResourceNotFoundException();
        }
        this.deletedAt = Objects.requireNonNull(deletedAt, "deletedAt");
    }
}
