package com.vireocode.backend.architecture;

import referencefixtures.architecture.RoleProofs;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import com.vireocode.backend.BackendApplication;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CrudArchitectureProofTests {
    private static final String APP = BackendApplication.class.getPackageName();

    @Test
    void acceptsConstructorInjectionRecordsAndTheExactPageSeam() {
        var graph = new ClassFileImporter().importClasses(RoleProofs.GoodEntity.class, RoleProofs.GoodRepository.class,
                RoleProofs.GoodRequest.class, RoleProofs.GoodResponse.class, RoleProofs.GoodService.class,
                RoleProofs.GoodController.class, RoleProofs.GoodSoftEntity.class);
        CrudArchitectureRules.roles(APP).check(graph);
        CrudArchitectureRules.entities(APP).check(graph);
        CrudArchitectureRules.sharedCrud(APP).check(graph);
        CrudArchitectureRules.publishedImports(APP).check(graph);
    }

    @Test
    void rejectsRoleReversalsIncludingGenericOnlyEntityLeak() {
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.BadController.class, "CONTROLLER_TO_PERSISTENCE");
        rejects(CrudArchitectureRules.roles("architecturefixtures.authroles"),
                architecturefixtures.authroles.auth.OtherController.class, "CONTROLLER_TO_PERSISTENCE");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.BadService.class, "SERVICE_TO_HTTP");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.BadResponse.class, "DTO_TO_INTERNAL_STATE");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.MutableRequest.class, "DTO_RECORD");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.BadEntity.class, "PERSISTENCE_TO_BUSINESS_OR_HTTP");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.FinalService.class, "UNPROXYABLE_TRANSACTION");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.FieldInjectedService.class, "FIELD_INJECTION");
        rejects(CrudArchitectureRules.roles(APP), RoleProofs.FieldInjectedService.class, "MUTABLE_INJECTED_STATE");
        rejects(CrudArchitectureRules.publishedImports("architecturefixtures.errorsdenied"),
                architecturefixtures.errorsdenied.auth.UndeclaredHelper.class, "UNPUBLISHED_REFERENCE_IMPORT");
    }

    @Test
    void rejectsMissingBaseAndSoftActiveRestriction() {
        rejects(CrudArchitectureRules.entities(APP), RoleProofs.NoBaseEntity.class, "BUSINESS_ENTITY_BASE");
        rejects(CrudArchitectureRules.entities(APP), RoleProofs.NoBaseEntity.class, "BUSINESS_ENTITY_METADATA");
        rejects(CrudArchitectureRules.entities(APP), RoleProofs.MissingRestriction.class, "SOFT_ACTIVE_RESTRICTION");
        rejects(CrudArchitectureRules.entities(APP), RoleProofs.ConflictingSoftEntity.class, "CONFLICTING_SOFT_DELETE");
        rejects(CrudArchitectureRules.entities(APP), RoleProofs.WrongConstructorEntity.class, "ENTITY_JPA_CONSTRUCTOR");
    }

    @Test
    void rejectsPublicBaseMutationAndInternalOrReverseCrudEdges() {
        var rule = CrudArchitectureRules.sharedCrud("architecturefixtures.cruddenied");
        rejects(rule, architecturefixtures.cruddenied.crud.BaseService.class, "PUBLIC_BASE_MUTATION_BYPASS");
        rejects(rule, architecturefixtures.cruddenied.crud.BaseService.class, "CRUD_TO_FEATURE");
        rejects(rule, architecturefixtures.cruddenied.feature.HiddenEntity.class, "INTERNAL_CRUD_TYPE");
        rejects(rule, architecturefixtures.cruddenied.crud.BaseEntity.class, "PUBLIC_METADATA_SETTER");
    }

    private void rejects(ArchRule rule, Class<?> type, String code) {
        var result = rule.evaluate(new ClassFileImporter().importClasses(type));
        assertThat(result.hasViolation()).isTrue();
        assertThat(result.getFailureReport().getDetails()).anyMatch(detail -> detail.contains(code));
    }
}
