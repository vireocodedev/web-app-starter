package com.vireocode.backend.crud;

import java.time.Instant;
import java.time.Clock;
import referencefixtures.contacts.ContactRepository;
import java.util.HashSet;
import com.vireocode.backend.reference.ReferenceTestSupport;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import referencefixtures.contacts.Contact;
import referencefixtures.contacts.ContactGroup;
import referencefixtures.contacts.ContactGroupRequest;
import referencefixtures.contacts.ContactRequest;

import static org.assertj.core.api.Assertions.*;

class BaseEntityIntegrationTests extends ReferenceTestSupport {
    @Test
    void assignedIdentityAndHashAreStableAcrossNewManagedDetachedAndUninitializedProxyInstances() {
        var original = new ContactGroup(ACTOR, "Identity");
        var unrelated = new ContactGroup(ACTOR, "Identity");
        var identities = new HashSet<ContactGroup>(); identities.add(original);
        assertThat(original.getId()).isNotNull();
        assertThat(original.getVersion()).isNull();
        assertThat(original).isNotEqualTo(unrelated).isNotEqualTo(null).isNotEqualTo("identity");
        tx().executeWithoutResult(status -> {
            assertThat(groupRows.save(original)).isSameAs(original);
            entities.flush();
            assertThat(original.getVersion()).isZero();
            assertThat(original.getCreatedAt()).isEqualTo(clock.instant());
            assertThat(identities).contains(original);
        });
        assertThat(identities).contains(original);
        tx().executeWithoutResult(status -> {
            var proxy = entities.getReference(ContactGroup.class, original.getId());
            assertThat(Hibernate.isInitialized(proxy)).isFalse();
            assertThat(proxy).isEqualTo(original);
            assertThat(original).isEqualTo(proxy);
            assertThat(proxy.hashCode()).isEqualTo(original.hashCode());
            assertThat(identities).contains(proxy);
            assertThat(Hibernate.isInitialized(proxy)).isFalse();
        });
        var reloaded = groupRows.findById(original.getId()).orElseThrow();
        assertThat(reloaded).isEqualTo(original);
        assertThat(reloaded.getId()).isEqualTo(original.getId());
    }
    @Test
    void auditingAndJpaVersionReflectFlushedStateAndSoftDeleteUsesTheSameClock() {
        var g = groups.create(ACTOR, new ContactGroupRequest("Audit"));
        var created = contacts.create(ACTOR, g.id(), new ContactRequest("a", "Alice", "Note"));
        assertThat(created.createdAt()).isEqualTo(clock.instant());
        assertThat(created.updatedAt()).isEqualTo(clock.instant());
        assertThat(created.version()).isZero();
        clock.set(Instant.parse("2026-01-02T00:00:00Z"));
        var changed = contacts.update(ACTOR, g.id(), created.id(), created.version(), new ContactRequest("a", "Changed", null));
        assertThat(changed.version()).isEqualTo(1L);
        assertThat(changed.createdAt()).isEqualTo(created.createdAt());
        assertThat(changed.updatedAt()).isEqualTo(clock.instant());
        assertThat(contactRows.findById(changed.id()).orElseThrow().getVersion()).isEqualTo(changed.version());
        clock.set(Instant.parse("2026-01-03T00:00:00Z"));
        contacts.delete(ACTOR, g.id(), changed.id(), changed.version());
        assertThat(jdbc.queryForObject("select version from template_reference_contact where id=?", Long.class, changed.id())).isEqualTo(2L);
        assertThat(jdbc.queryForObject("select deleted_at = updated_at from template_reference_contact where id=?", Boolean.class, changed.id())).isTrue();
        assertThat(contactRows.findById(changed.id())).isEmpty();
    }
    @Test
    void constraintFailureRollsBackAnEarlierMutationInTheSameServiceTransaction() {
        var g = group();
        assertThatThrownBy(() -> tx().executeWithoutResult(status -> {
            contacts.create(ACTOR, g.id(), new ContactRequest("same", "First", null));
            contacts.create(ACTOR, g.id(), new ContactRequest("same", "Second", null));
        })).isInstanceOf(org.hibernate.exception.ConstraintViolationException.class);
        assertThat(contactRows.countByGroupId(g.id())).isZero();
    }
    @Test
    void hardModePhysicallyRemovesASoftCapableEntityWhenThatServiceChoosesHard() {
        var g = group();
        var c = contact(g.id(), "hard");
        var hardDeletion = new ContactDeletion(contactRows, DeleteMode.HARD, clock);
        tx().executeWithoutResult(status -> {
            var managed = contactRows.findById(c.id()).orElseThrow();
            hardDeletion.remove(managed, c.version());
            entities.flush();
        });
        assertThat(jdbc.queryForObject("select count(*) from template_reference_contact where id=?", Integer.class, c.id())).isZero();
    }

    @Test
    void softModeUpdatesTheManagedTargetWhenLookupReturnsAnUninitializedHibernateProxy() {
        var g = group();
        var c = contact(g.id(), "proxy");
        var softDeletion = new ContactDeletion(contactRows, DeleteMode.SOFT, clock);
        clock.set(Instant.parse("2026-01-04T00:00:00Z"));

        tx().executeWithoutResult(status -> {
            var proxy = entities.getReference(Contact.class, c.id());
            assertThat(Hibernate.isInitialized(proxy)).isFalse();
            softDeletion.remove(proxy, c.version());
            entities.flush();
        });

        assertThat(jdbc.queryForObject(
                "select deleted_at is not null and deleted_at=updated_at and version=1 "
                        + "from template_reference_contact where id=?", Boolean.class, c.id())).isTrue();
        assertThat(contactRows.findById(c.id())).isEmpty();
    }

    private static final class ContactDeletion extends BaseService<Contact> {
        ContactDeletion(ContactRepository rows, DeleteMode mode, Clock clock) {
            super(Contact.class, rows, mode, clock);
        }

        void remove(Contact entity, long version) {
            deleteManaged(entity, version);
        }
    }

}
