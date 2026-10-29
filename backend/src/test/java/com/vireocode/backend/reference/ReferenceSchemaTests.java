package com.vireocode.backend.reference;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.*;

class ReferenceSchemaTests extends ReferenceTestSupport {
    private String bootstrap() throws Exception {
        return new ClassPathResource("reference-feature/db/migration/R__template_reference_schema.sql")
        .getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    void repeatableBootstrapIsIdempotentAndChecksActualConstraintShapes() throws Exception {
        jdbc.execute(bootstrap());
        jdbc.execute(bootstrap());
        assertThat(jdbc.queryForObject("select count(*) from pg_constraint where conrelid='template_reference_contact'::regclass "
        + "and conname in ('template_reference_contact_group_code_uk','template_reference_contact_group_fk') and convalidated", Integer.class)).isEqualTo(2);
    }

    @Test
    void missingUniqueOrMissingOrWrongForeignKeyFailsBeforeUse() throws Exception {
        // One dedicated connection + rollback keeps intentional drift invisible to other contexts.
        for (var alteration:new String[]{
            "alter table template_reference_contact drop constraint template_reference_contact_group_code_uk",
            "alter table template_reference_contact drop constraint template_reference_contact_group_fk",
            "alter table template_reference_contact disable trigger all",
            "alter table template_reference_contact drop constraint template_reference_contact_group_fk; "
            + "alter table template_reference_contact add constraint template_reference_contact_group_fk foreign key(group_id) references app_user(id)"
        }) {
            try (var connection = jdbc.getDataSource().getConnection()) {
                connection.setAutoCommit(false);
                try {
                    var isolated = new JdbcTemplate(new SingleConnectionDataSource(connection, true));
                    isolated.execute(alteration);
                    assertThatThrownBy(() -> isolated.execute(bootstrap())).isInstanceOf(org.springframework.dao.DataAccessException.class);
                } finally {
                    connection.rollback();
                }
            }
        }

        jdbc.execute(bootstrap());
    }

    @Test
    void physicalForeignKeyRejectsAbsentGroupAndRetainedChildBlocksHardDelete() {
        var g = group();
        var c = contact(g.id(), "a");
        contacts.delete(ACTOR, g.id(), c.id(), c.version());
        assertThatThrownBy(() -> jdbc.update("delete from template_reference_contact_group where id=?", g.id()))
        .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("update template_reference_contact set group_id=? where id=?", java.util.UUID.randomUUID(), c.id()))
        .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("select group_id from template_reference_contact where id=?", java.util.UUID.class, c.id())).isEqualTo(g.id());
    }

    @Test
    void hibernateValidationRejectsMissingMappedColumnAndWrongType() {
        var validator = entityFactory.unwrap(org.hibernate.SessionFactory.class).getSchemaManager();
        jdbc.execute("alter table template_reference_contact drop column note");
        try {
            assertThatThrownBy(validator::validateMappedObjects)
            .isInstanceOf(org.hibernate.tool.schema.spi.SchemaManagementException.class);
        } finally {
            jdbc.execute("alter table template_reference_contact add column note varchar(500)");
        }

        jdbc.execute("alter table template_reference_contact alter column note type integer using null");
        try {
            assertThatThrownBy(validator::validateMappedObjects)
            .isInstanceOf(org.hibernate.tool.schema.spi.SchemaManagementException.class);
        } finally {
            jdbc.execute("alter table template_reference_contact alter column note type varchar(500) using note::varchar");
        }

        validator.validateMappedObjects();
    }
}
