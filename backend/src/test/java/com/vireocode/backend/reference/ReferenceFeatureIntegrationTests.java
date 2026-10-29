package com.vireocode.backend.reference;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.vireocode.backend.crud.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import referencefixtures.contacts.*;
import static org.assertj.core.api.Assertions.*;

class ReferenceFeatureIntegrationTests extends ReferenceTestSupport {
    private static final String GROUPS = "/reference/contact-groups";
    @Test
    void actualHttpCrudUsesSharedRequestFullPutCurrentMetadataAndBothDeleteModes() throws Exception {
        login();
        var createdGroup = send("POST", GROUPS, "{\"name\":\"Friends\"}", null, true);
        assertThat(createdGroup.statusCode()).as(createdGroup.body()).isEqualTo(201);
        var g = tree(createdGroup);
        var groupPath = GROUPS + "/" + g.path("id").asString();
        assertThat(createdGroup.headers().firstValue("Location")).contains("/api" + groupPath);
        var created = send("POST", groupPath + "/contacts", "{\"code\":\"a\",\"displayName\":\"Alice\",\"note\":\"old\"}", null, true);
        assertThat(created.statusCode()).as(created.body()).isEqualTo(201);
        var c = tree(created);
        var path = groupPath + "/contacts/" + c.path("id").asString();
        assertThat(c.path("groupName").asString()).isEqualTo("Friends");
        assertThat(c.path("version").asLong()).isZero();
        clock.set(Instant.parse("2026-01-02T00:00:00Z"));
        var changed = send("PUT", path, "{\"code\":\"a\",\"displayName\":\"Alice Updated\",\"note\":null}", "0", true);
        assertThat(changed.statusCode()).as(changed.body()).isEqualTo(200);
        var updated = tree(changed);
        assertThat(updated.path("version").asLong()).isEqualTo(1);
        assertThat(updated.path("note").isNull()).isTrue();
        assertThat(updated.path("createdAt").asString()).isEqualTo(c.path("createdAt").asString());
        assertThat(updated.path("updatedAt").asString()).isEqualTo("2026-01-02T00:00:00Z");
        assertThat(jdbc.queryForObject("select version from template_reference_contact where id=?", Long.class, UUID.fromString(c.path("id").asString()))).isEqualTo(1L);
        error(send("PUT", path, "{\"code\":\"a\",\"displayName\":\"private-secret\"}", "0", true), 409, "VERSION_CONFLICT");
        error(send("DELETE", groupPath, null, "0", true), 409, "RESOURCE_IN_USE");
        assertThat(send("DELETE", path, null, "1", true).statusCode()).isEqualTo(204);
        error(send("GET", path, null, null, false), 404, "RESOURCE_NOT_FOUND");
        error(send("DELETE", path, null, "1", true), 404, "RESOURCE_NOT_FOUND");
        assertThat(jdbc.queryForObject("select deleted_at is not null and version=2 from template_reference_contact where id=?", Boolean.class, UUID.fromString(c.path("id").asString()))).isTrue();
        // Physical FK retention is intentional even after soft deletion.
        error(send("DELETE", groupPath, null, "0", true), 409, "RESOURCE_IN_USE");
        var empty = groups.create(ACTOR, new ContactGroupRequest("Empty"));
        assertThat(send("DELETE", GROUPS + "/" + empty.id(), null, "0", true).statusCode()).isEqualTo(204);
        assertThat(jdbc.queryForObject("select count(*) from template_reference_contact_group where id=?", Integer.class, empty.id())).isZero();
        error(send("DELETE", GROUPS + "/" + empty.id(), null, "0", true), 404, "RESOURCE_NOT_FOUND");
    }

    @Test
    void authenticatedSessionAndFreshCsrfAreRequired() throws Exception {
        error(send("GET", GROUPS, null, null, false), 401, "AUTHENTICATION_REQUIRED");
        login();
        error(send("POST", GROUPS, "{\"name\":\"A\"}", null, false), 403, "CSRF_INVALID");
        error(send("POST", GROUPS, "{}", null, true), 400, "VALIDATION_FAILED");
        error(send("POST", GROUPS, "private-secret", null, true), 400, "INVALID_REQUEST");
    }

    @Test
    void versionsAndPageInputsAreStrictlyBoundedWithoutMutation() throws Exception {
        login();
        var g = group();
        var c = contact(g.id(), "a");
        var path = GROUPS+"/"+g.id()+"/contacts/"+c.id();
        for (var version : List.of("-1", "1.2", "abc", "9223372036854775808", "+0")) {
            error(send("PUT", path, "{\"code\":\"a\",\"displayName\":\"Changed\"}", version, true), 400, "INVALID_REQUEST");
            error(send("DELETE", path, null, version, true), 400, "INVALID_REQUEST");
        }

        error(send("DELETE", path, null, null, true), 400, "INVALID_REQUEST");
        assertThat(contacts.read(ACTOR, g.id(), c.id()).version()).isZero();
        for (var query : List.of("size=0", "size=101", "page=-1", "size=2147483648", "sort=actorKey", "direction=sideways", "search="+"a".repeat(101)))
        error(send("GET", GROUPS+"/"+g.id()+"/contacts?"+query, null, null, false), 400, "INVALID_REQUEST");
        var page = tree(send("GET", GROUPS+"/"+g.id()+"/contacts", null, null, false));
        assertThat(page.path("size").asInt()).isEqualTo(20);
        assertThat(page.path("totalItems").asLong()).isEqualTo(1);
    }

    @Test
    void foreignScopeAndMissingIdsHideDataBeforeVersionChecks() throws Exception {
        login();
        var other = groups.create("different-actor", new ContactGroupRequest("Private"));
        var c = contacts.create("different-actor", other.id(), new ContactRequest("a", "Secret", null));
        for (var path:List.of(GROUPS+"/"+other.id(), GROUPS+"/"+other.id()+"/contacts", GROUPS+"/"+other.id()+"/contacts/"+c.id()))
        error(send("GET", path, null, null, false), 404, "RESOURCE_NOT_FOUND");
        error(send("PUT", GROUPS+"/"+other.id()+"/contacts/"+c.id(), "{\"code\":\"a\",\"displayName\":\"Changed\"}", "999", true), 404, "RESOURCE_NOT_FOUND");
        error(send("DELETE", GROUPS+"/"+UUID.randomUUID(), null, "999", true), 404, "RESOURCE_NOT_FOUND");
        assertThat(groups.list(ACTOR, 0, 20, "name", "asc").totalItems()).isZero();
        assertThatThrownBy(() -> groups.create(" ", new ContactGroupRequest("Invalid"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> contacts.read("", other.id(), c.id())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> contacts.read(ACTOR, other.id(), c.id())).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void exactUniqueConstraintMapsToSafeConflictAndRetainedCodesRemainReserved() throws Exception {
        login();
        var g = group();
        var a = contact(g.id(), "a");
        var b = contact(g.id(), "b");
        var path = GROUPS+"/"+g.id()+"/contacts";
        error(send("POST", path, "{\"code\":\"a\",\"displayName\":\"Duplicate\"}", null, true), 409, "REQUEST_REJECTED");
        error(send("PUT", path+"/"+b.id(), "{\"code\":\"a\",\"displayName\":\"Duplicate\"}", "0", true), 409, "REQUEST_REJECTED");
        assertThat(contacts.read(ACTOR, g.id(), b.id()).code()).isEqualTo("b");
        contacts.delete(ACTOR, g.id(), a.id(), a.version());
        error(send("POST", path, "{\"code\":\"a\",\"displayName\":\"Duplicate\"}", null, true), 409, "REQUEST_REJECTED");
        assertThat(jdbc.queryForObject("select count(*) from template_reference_contact", Integer.class)).isEqualTo(2);
    }

    @Test
    void softRowsAreHiddenFromDerivedJpqlNativeCountAndSameContextOwnedLookup() {
        var g = group();
        var c = contact(g.id(), "a");
        contact(g.id(), "b");
        tx().executeWithoutResult(status -> {
            var managed = contactRows.findById(c.id()).orElseThrow();
            contacts.delete(ACTOR, g.id(), c.id(), c.version());
            assertThat(entities.contains(managed)).isTrue();
            assertThat(managed.getDeletedAt()).isNotNull();
            assertThatThrownBy(() -> contacts.read(ACTOR, g.id(), c.id())).isInstanceOf(ResourceNotFoundException.class);
            status.setRollbackOnly();
            // The deliberately rejected joined service call marks this transaction rollback-only.
        });
        contacts.delete(ACTOR, g.id(), c.id(), c.version());
        assertThat(contactRows.findById(c.id())).isEmpty();
        assertThat(contactRows.findByGroupId(g.id())).hasSize(1);
        assertThat(contactRows.countByGroupId(g.id())).isEqualTo(1);
        assertThat(contactRows.activeNative(g.id(), ACTOR)).hasSize(1);
        assertThat(contactRows.activeNativeCount(g.id(), ACTOR)).isEqualTo(1);
        assertThat(contactRows.activeNativeCount(g.id(), "foreign")).isZero();
        assertThat(contacts.list(ACTOR, g.id(), 0, 20, "code", "asc", "Contact a").totalItems()).isZero();
    }

    @Test
    void referenceOpenApiDescribesSharedRequestVersionPagingAndCsrfOnlyInReferenceContext() throws Exception {
        var api = tree(send("GET", "/v3/api-docs", null, null, false));
        var path = api.path("paths").path("/reference/contact-groups/{groupId}/contacts/{id}");
        assertThat(path.path("put").toString()).contains("X-Expected-Version", "required", "csrfToken");
        var schemas = api.path("components").path("schemas");
        assertThat(schemas.has("ContactRequest")).isTrue();
        assertThat(schemas.has("CreateContactRequest")).isFalse();
        assertThat(schemas.path("ContactResponse").path("properties").has("version")).isTrue();
        assertThat(schemas.path("ContactResponse").path("properties").has("groupName")).isTrue();
        assertThat(api.toString()).contains("totalItems", "RESOURCE_NOT_FOUND", "VERSION_CONFLICT", "RESOURCE_IN_USE");
        var groupPaths = api.path("paths").path("/reference/contact-groups");
        assertThat(groupPaths.path("post").path("responses").path("201").path("content")
                .path("application/json").path("schema").path("$ref").asString())
                .isEqualTo("#/components/schemas/ContactGroupResponse");
        var contactPaths = api.path("paths").path("/reference/contact-groups/{groupId}/contacts");
        assertThat(contactPaths.path("post").path("responses").path("409").path("content")
                .path("application/json").path("schema").path("$ref").asString()).isEqualTo("#/components/schemas/ApiError");
        assertThat(path.path("get").path("responses").path("404").path("content")
                .path("application/json").path("schema").path("$ref").asString()).isEqualTo("#/components/schemas/ApiError");
        for (var resourcePath : List.of(path, api.path("paths").path("/reference/contact-groups/{id}"))) {
            var response = resourcePath.path("delete").path("responses").path("204");
            assertThat(response.isMissingNode()).isFalse();
            assertThat(response.has("content")).isFalse();
        }
        for (var entry : api.path("paths").properties()) {
            if (!entry.getKey().startsWith("/reference/")) continue;
            for (var method : List.of("post", "put", "delete")) {
                var operation = entry.getValue().path(method);
                if (operation.isMissingNode()) continue;
                var security = operation.path("security");
                assertThat(security.size()).as(entry.getKey() + " " + method).isEqualTo(1);
                assertThat(security.get(0).has("sessionCookie")).isTrue();
                assertThat(security.get(0).has("csrfToken")).isTrue();
            }
        }
    }
}
