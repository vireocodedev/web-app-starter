package com.vireocode.backend.reference;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import com.vireocode.backend.crud.ResourceInUseException;
import com.vireocode.backend.crud.ResourceNotFoundException;
import com.vireocode.backend.crud.VersionConflictException;
import org.junit.jupiter.api.Test;
import referencefixtures.contacts.Contact;
import referencefixtures.contacts.ContactGroupRequest;
import referencefixtures.contacts.ContactRequest;
import static org.assertj.core.api.Assertions.*;

class ReferenceConcurrencyTests extends ReferenceTestSupport {
    private static void await(CountDownLatch latch) {
        try {
            assertThat(latch.await(15, TimeUnit.SECONDS)).isTrue();
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(failure);
        }
    }

    private void awaitDatabaseLock(int pid) {
        long deadline = System.nanoTime()+Duration.ofSeconds(10).toNanos();
        while (System.nanoTime()<deadline) {
            if (Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from pg_stat_activity where pid=? and wait_event_type='Lock')", Boolean.class, pid))) return;
            java.util.concurrent.locks.LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(5));
        }

        fail("Contender did not reach a PostgreSQL lock wait");
    }

    @Test
    void childCreateAndParentDeleteUseTheSameParentLockAndRecheckAfterCommit() throws Exception {
        var g = group();
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var contenderStarted = new CountDownLatch(1);
        var contenderPid = new java.util.concurrent.atomic.AtomicInteger();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var writer = executor.submit(() -> tx().execute(status -> {
                groupRows.lockOwned(g.id(), ACTOR).orElseThrow();
                contacts.create(ACTOR, g.id(), new ContactRequest("a", "Alice", null));
                held.countDown();
                await(release);
                return null;
            }));
            await(held);
            Future<?> deletion = null;
            try {
                deletion = executor.submit(() -> tx().execute(status -> {
                    contenderPid.set(jdbc.queryForObject("select pg_backend_pid()", Integer.class));
                    contenderStarted.countDown();
                    groups.delete(ACTOR, g.id(), g.version());
                    return null;
                }));
                await(contenderStarted);
                awaitDatabaseLock(contenderPid.get());
                assertThat(deletion.isDone()).isFalse();
            } finally {
                release.countDown();
            }

            writer.get(15, TimeUnit.SECONDS);
            var attempted = deletion;
            assertThatThrownBy(() -> attempted.get(15, TimeUnit.SECONDS)).hasRootCauseInstanceOf(ResourceInUseException.class);
        }

        assertThat(contactRows.retainedCount(g.id())).isEqualTo(1);
        assertThat(groupRows.existsById(g.id())).isTrue();
    }

    @Test
    void deleteWinningParentLockMakesLaterChildCreateNotFound() throws Exception {
        var g = group();
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var entered = new CountDownLatch(1);
        var pid = new java.util.concurrent.atomic.AtomicInteger();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var deletion = executor.submit(() -> tx().execute(status -> {
                groups.delete(ACTOR, g.id(), g.version());
                held.countDown();
                await(release);
                return null;
            }));
            await(held);
            var creation = executor.submit(() -> tx().execute(status -> {
                pid.set(jdbc.queryForObject("select pg_backend_pid()", Integer.class));
                entered.countDown();
                return contacts.create(ACTOR, g.id(), new ContactRequest("a", "Alice", null));
            }));
            try {
                await(entered);
                awaitDatabaseLock(pid.get());
            } finally {
                release.countDown();
            }

            deletion.get(15, TimeUnit.SECONDS);
            assertThatThrownBy(() -> creation.get(15, TimeUnit.SECONDS)).hasRootCauseInstanceOf(ResourceNotFoundException.class);
        }

        assertThat(contactRows.retainedCount(g.id())).isZero();
    }

    @Test
    void sharedParentSerializesStaleUpdateAndDeleteWithoutRetryingUserIntent() throws Exception {
        var g = group();
        var c = contact(g.id(), "a");
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var writer = executor.submit(() -> tx().execute(status -> {
                contacts.update(ACTOR, g.id(), c.id(), c.version(), new ContactRequest("a", "Winner", null));
                held.countDown();
                await(release);
                return null;
            }));
            await(held);
            var contender = executor.submit(() -> contacts.delete(ACTOR, g.id(), c.id(), c.version()));
            release.countDown();
            writer.get(15, TimeUnit.SECONDS);
            assertThatThrownBy(() -> contender.get(15, TimeUnit.SECONDS)).hasRootCauseInstanceOf(VersionConflictException.class);
        } finally {
            release.countDown();
        }

        assertThat(contacts.read(ACTOR, g.id(), c.id()).displayName()).isEqualTo("Winner");
    }

    @Test
    void lowerLevelOptimisticUpdateUpdateAndUpdateDeleteRacesRejectLostWrites() throws Exception {
        for (boolean remove:new boolean[]{
            false, true
        }) {
            var g = groups.create(ACTOR, new ContactGroupRequest("Race"));
            var c = contact(g.id(), "a");
            var read = new CountDownLatch(1);
            var release = new CountDownLatch(1);
            try (var executor = Executors.newSingleThreadExecutor()) {
                var stale = executor.submit(() -> tx().execute(status -> {
                    var entity = entities.find(Contact.class, c.id());
                    read.countDown();
                    await(release);
                    if (remove) entities.remove(entity);
                    else entity.replace("a", "Loser", null);
                    entities.flush();
                    return null;
                }));
                await(read);
                try {
                    contacts.update(ACTOR, g.id(), c.id(), c.version(), new ContactRequest("a", "Winner", null));
                } finally {
                    release.countDown();
                }

                assertThatThrownBy(() -> stale.get(15, TimeUnit.SECONDS))
                .hasCauseInstanceOf(jakarta.persistence.OptimisticLockException.class);
            }

            assertThat(contacts.read(ACTOR, g.id(), c.id()).displayName()).isEqualTo("Winner");
        }
    }

    @Test
    void noOpPutStillChecksOptimisticVersionAtCommitAgainstAnIndependentWriter() throws Exception {
        var g = group();
        var c = contact(g.id(), "a");
        var ready = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var executor = Executors.newSingleThreadExecutor()) {
            // The service parent lock serializes cooperating writers. This named lower-level writer
            // deliberately bypasses that protocol to prove the independent JPA commit check.
            var noOp = executor.submit(() -> tx().execute(status -> {
                contacts.update(ACTOR, g.id(), c.id(), c.version(), new ContactRequest(c.code(), c.displayName(), c.note()));
                ready.countDown();
                await(release);
                return null;
            }));
            await(ready);
            try {
                tx().executeWithoutResult(status -> {
                    var entity = entities.find(Contact.class, c.id());
                    entity.replace("a", "Independent winner", null);
                    entities.flush();
                });
            } finally {
                release.countDown();
            }

            assertThatThrownBy(() -> noOp.get(15, TimeUnit.SECONDS))
            .hasCauseInstanceOf(org.springframework.orm.ObjectOptimisticLockingFailureException.class);
        }

        assertThat(contacts.read(ACTOR, g.id(), c.id()).displayName()).isEqualTo("Independent winner");
    }

    @Test
    void concurrentUniqueInsertCommitsExactlyOneRowAndRollsBackTheOther() throws Exception {
        login();
        var g = group();
        var ready = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var winnerPid = new java.util.concurrent.atomic.AtomicInteger();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> tx().execute(status -> {
                winnerPid.set(jdbc.queryForObject("select pg_backend_pid()", Integer.class));
                contacts.create(ACTOR, g.id(), new ContactRequest("same", "First", null));
                ready.countDown();
                await(release);
                return null;
            }));
            await(ready);
            var second = executor.submit(() -> send("POST", "/reference/contact-groups/"+g.id()+"/contacts",
            "{\"code\":\"same\",\"displayName\":\"Second\"}", null, true));
            try {
                long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
                boolean blocked = false;
                while (System.nanoTime() < deadline) {
                    blocked = Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from pg_stat_activity "
                            + "where ? = any(pg_blocking_pids(pid)) and wait_event_type='Lock')", Boolean.class, winnerPid.get()));
                    if (blocked) break;
                    java.util.concurrent.locks.LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(5));
                }
                assertThat(blocked).as("HTTP contender reached PostgreSQL while the winning transaction was still open").isTrue();
                assertThat(second.isDone()).isFalse();
            } finally {
                release.countDown();
            }
            first.get(15, TimeUnit.SECONDS);
            error(second.get(15, TimeUnit.SECONDS), 409, "REQUEST_REJECTED");
        } finally {
            release.countDown();
        }

        assertThat(contactRows.countByGroupId(g.id())).isEqualTo(1);
    }
}
