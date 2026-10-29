package com.vireocode.backend.reference;

import java.util.Comparator;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import referencefixtures.contacts.ContactRequest;
import static org.assertj.core.api.Assertions.*;

class ReferenceQueryBudgetTests extends ReferenceTestSupport {
    @Test
    void fullPageHasDeterministicTiesFetchedGroupProjectionAndAtMostThreeSelects() {
        var group = group();
        for (int i = 0;i<25;i++) contacts.create(ACTOR, group.id(), new ContactRequest("code-"+i, "Same label", null));
        var stats = entityFactory.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
        var page = contacts.list(ACTOR, group.id(), 0, 20, "displayName", "asc", "");
        assertThat(page.items()).hasSize(20).allSatisfy(c -> assertThat(c.groupName()).isEqualTo("Partners"));
        assertThat(page.totalItems()).isEqualTo(25);
        assertThat(stats.getPrepareStatementCount()).as("scope + page join-fetch + count; excludes fixture preparation/session HTTP SQL").isLessThanOrEqualTo(3);
        // PostgreSQL UUID compares unsigned bytes, unlike UUID's signed-long natural comparator.
        assertThat(page.items().stream().map(c -> c.id().toString()).toList()).isSortedAccordingTo(Comparator.naturalOrder());
        var next = contacts.list(ACTOR, group.id(), 1, 20, "displayName", "asc", "");
        assertThat(next.items()).hasSize(5);
        assertThat(next.items().stream().map(c -> c.id()).toList()).doesNotContainAnyElementsOf(page.items().stream().map(c -> c.id()).toList());
        assertThat(contacts.list(ACTOR, group.id(), 0, 100, "code", "desc", "").items()).hasSize(25);
        assertThat(contacts.list(ACTOR, group.id(), 2, 20, "code", "asc", "").items()).isEmpty();
    }

    @Test
    void searchTreatsSqlWildcardCharactersAsLiteralAndDoesNotChangeVisibility() {
        var g = group();
        contacts.create(ACTOR, g.id(), new ContactRequest("percent", "100% literal", null));
        contacts.create(ACTOR, g.id(), new ContactRequest("plain", "100X literal", null));
        assertThat(contacts.list(ACTOR, g.id(), 0, 20, "code", "asc", "%").items()).hasSize(1);
        assertThatThrownBy(() -> contacts.list("foreign", g.id(), 0, 20, "code", "asc", "")).isInstanceOf(com.vireocode.backend.crud.ResourceNotFoundException.class);
    }
}
