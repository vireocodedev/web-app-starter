package com.vireocode.backend.crud;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;

/** Server-owned identity, optimistic version and current-row timestamps. */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // A null version lets Spring Data recognize a new entity with an assigned ID.
    @Version
    @Column(nullable = false)
    private Long version;

    protected BaseEntity() {
    }

    public UUID getId() {
        return id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    @Override
    public final boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof BaseEntity entity) || persistentClass(this) != persistentClass(entity)) {
            return false;
        }
        UUID identity = persistentId(this);
        return identity != null && identity.equals(persistentId(entity));
    }

    @Override
    public final int hashCode() {
        // Remains stable across persistence and does not initialize a lazy proxy.
        return persistentClass(this).hashCode();
    }

    private static Class<?> persistentClass(BaseEntity entity) {
        return entity instanceof HibernateProxy proxy
            ? proxy.getHibernateLazyInitializer().getPersistentClass()
            : entity.getClass();
    }

    private static UUID persistentId(BaseEntity entity) {
        return entity instanceof HibernateProxy proxy
            ? (UUID) proxy.getHibernateLazyInitializer().getInternalIdentifier()
            : entity.id;
    }
}
