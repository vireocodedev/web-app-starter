package com.vireocode.backend.crud;

import java.lang.reflect.Modifier;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.hibernate.proxy.HibernateProxy;
import org.hibernate.proxy.LazyInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class BaseServiceTests {

    private static final Instant NOW = Instant.parse("2026-01-02T03:04:05Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);
    private final TransactionTemplate transactions = new TransactionTemplate(new TestTransactionManager());

    @Test
    void absentAndAlreadyManagedDeletedResultsAreHidden() {
        var repository = repository();
        var service = new RetainedService(repository, DeleteMode.SOFT);
        assertThatThrownBy(() -> service.lookup(Optional::empty)).isInstanceOf(ResourceNotFoundException.class);
        var entity = retained(3L);
        assertThat(service.lookup(() -> Optional.of(entity))).isSameAs(entity);
        entity.markDeleted(NOW);
        assertThatThrownBy(() -> service.lookup(() -> Optional.of(entity)))
            .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(repository);
    }

    @Test
    void hardIsTheDefaultAndCanPhysicallyDeleteASoftCapableEntity() {
        var repository = repository();
        var service = new RetainedService(repository);
        var entity = retained(3L);
        transactions.executeWithoutResult(status -> service.remove(entity, 3L));
        verify(repository).delete(entity);
        assertThat(entity.getDeletedAt()).isNull();
    }

    @Test
    void softDeleteChangesOnlyTheManagedEntityUsingTheInjectedClock() {
        var repository = repository();
        var service = new RetainedService(repository, DeleteMode.SOFT);
        var entity = retained(3L);
        transactions.executeWithoutResult(status -> service.remove(entity, 3L));
        assertThat(entity.getDeletedAt()).isEqualTo(NOW);
        verifyNoInteractions(repository);
        transactions.executeWithoutResult(status -> assertThatThrownBy(() -> service.remove(entity, 3L))
            .isInstanceOf(ResourceNotFoundException.class));
    }

    @Test
    void staleMissingAndNegativeVersionsCannotMutate() {
        var repository = repository();
        var service = new RetainedService(repository, DeleteMode.SOFT);
        var stale = retained(3L);
        var unsaved = new RetainedEntity();
        transactions.executeWithoutResult(status -> {
            assertThatThrownBy(() -> service.remove(stale, 2L)).isInstanceOf(VersionConflictException.class);
            assertThatThrownBy(() -> service.remove(unsaved, 0L)).isInstanceOf(VersionConflictException.class);
            assertThatThrownBy(() -> service.remove(stale, -1L)).isInstanceOf(IllegalArgumentException.class);
        });
        assertThat(stale.getDeletedAt()).isNull();
        assertThat(unsaved.getDeletedAt()).isNull();
        verifyNoInteractions(repository);
    }

    @Test
    void deleteRequiresARealSpringTransactionRatherThanAnAnnotationOnTheHelper() {
        var repository = repository();
        var service = new RetainedService(repository);
        var entity = retained(3L);
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
        assertThatThrownBy(() -> service.remove(entity, 3L)).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(repository);
        transactions.executeWithoutResult(status -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            service.remove(entity, 3L);
        });
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
        verify(repository).delete(entity);
    }

    @Test
    void invalidSoftCapabilityFailsWhenTheServiceIsConstructed() {
        @SuppressWarnings("unchecked")
        JpaRepository<HardEntity, UUID> repository = mock(JpaRepository.class);
        assertThatThrownBy(() -> new HardService(repository, DeleteMode.SOFT))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("SoftDeletableEntity");
        new HardService(repository, DeleteMode.HARD);
        verifyNoInteractions(repository);
    }

    @Test
    void readOnlyTransactionCannotPerformHardOrSoftDeletion() {
        var repository = repository();
        var hard = new RetainedService(repository);
        var soft = new RetainedService(repository, DeleteMode.SOFT);
        var entity = retained(3L);
        var readOnly = new TransactionTemplate(new TestTransactionManager());
        readOnly.setReadOnly(true);
        readOnly.executeWithoutResult(status -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            assertThat(TransactionSynchronizationManager.isCurrentTransactionReadOnly()).isTrue();
            assertThatThrownBy(() -> hard.remove(entity, 3L)).isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> soft.remove(entity, 3L)).isInstanceOf(IllegalStateException.class);
        });
        assertThat(entity.getDeletedAt()).isNull();
        verifyNoInteractions(repository);
    }

    @Test
    void helperAndMetadataApisHaveNoPublicMutationBypass() {
        assertThat(Arrays.stream(BaseService.class.getDeclaredMethods())
            .filter(method -> Modifier.isPublic(method.getModifiers()))).isEmpty();
        assertThat(Arrays.stream(BaseEntity.class.getDeclaredMethods())
            .filter(method -> Modifier.isPublic(method.getModifiers()))
            .map(java.lang.reflect.Method::getName))
            .containsExactlyInAnyOrder("getId", "getCreatedAt", "getUpdatedAt", "getVersion", "equals", "hashCode");
        assertThat(Arrays.stream(SoftDeletableEntity.class.getDeclaredMethods())
            .filter(method -> Modifier.isPublic(method.getModifiers()))
            .map(java.lang.reflect.Method::getName)).containsExactly("getDeletedAt");
    }

    @Test
    void assignedIdentityAndHashRemainStableWhenVersionAndTimestampsChange() {
        var entity = new RetainedEntity();
        assertThat(entity.getId()).isNotNull();
        assertThat(entity.getVersion()).isNull();
        assertThat(entity.getCreatedAt()).isNull();
        var identities = new HashSet<BaseEntity>();
        identities.add(entity);
        int hash = entity.hashCode();
        ReflectionTestUtils.setField(entity, "version", 0L);
        ReflectionTestUtils.setField(entity, "createdAt", NOW);
        ReflectionTestUtils.setField(entity, "updatedAt", NOW.plusSeconds(1));
        assertThat(entity.hashCode()).isEqualTo(hash);
        assertThat(identities).contains(entity);
        assertThat(entity).isNotEqualTo(new RetainedEntity()).isNotEqualTo(new HardEntity());
    }

    @Test
    void proxyEqualityIsSymmetricWithoutInitializingTheProxy() {
        var entity = retained(3L);
        var initializer = mock(LazyInitializer.class);
        when(initializer.getInternalIdentifier()).thenReturn(entity.getId());
        doReturn(RetainedEntity.class).when(initializer).getPersistentClass();
        var proxy = new RetainedProxy(initializer);
        assertThat(entity.equals(proxy)).isTrue();
        assertThat(proxy.equals(entity)).isTrue();
        assertThat(proxy.hashCode()).isEqualTo(entity.hashCode());
        verify(initializer, never()).initialize();
        verify(initializer, never()).getImplementation();
        verify(initializer, never()).getIdentifier();
    }

    @SuppressWarnings("unchecked")
    private static JpaRepository<RetainedEntity, UUID> repository() {
        return mock(JpaRepository.class);
    }

    private static RetainedEntity retained(Long version) {
        var entity = new RetainedEntity();
        ReflectionTestUtils.setField(entity, "version", version);
        return entity;
    }

    private static class RetainedEntity extends SoftDeletableEntity {
    }

    private static class HardEntity extends BaseEntity {
    }

    private static class RetainedProxy extends RetainedEntity implements HibernateProxy {
        private final LazyInitializer initializer;

        RetainedProxy(LazyInitializer initializer) {
            this.initializer = initializer;
        }

        @Override
        public Object writeReplace() {
            throw new UnsupportedOperationException();
        }

        @Override
        public LazyInitializer getHibernateLazyInitializer() {
            return initializer;
        }
    }

    private static class RetainedService extends BaseService<RetainedEntity> {
        RetainedService(JpaRepository<RetainedEntity, UUID> repository) {
            super(RetainedEntity.class, repository, CLOCK);
        }

        RetainedService(JpaRepository<RetainedEntity, UUID> repository, DeleteMode mode) {
            super(RetainedEntity.class, repository, mode, CLOCK);
        }

        RetainedEntity lookup(Supplier<Optional<RetainedEntity>> lookup) {
            return requireActive(lookup);
        }

        void remove(RetainedEntity entity, long expectedVersion) {
            deleteManaged(entity, expectedVersion);
        }
    }

    private static class HardService extends BaseService<HardEntity> {
        HardService(JpaRepository<HardEntity, UUID> repository, DeleteMode mode) {
            super(HardEntity.class, repository, mode, CLOCK);
        }
    }

    /** Exercises Spring's real transaction synchronization without starting a database. */
    private static class TestTransactionManager extends AbstractPlatformTransactionManager {
        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    }
}
