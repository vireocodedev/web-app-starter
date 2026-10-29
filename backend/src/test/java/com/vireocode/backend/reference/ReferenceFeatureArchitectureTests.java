package com.vireocode.backend.reference;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.vireocode.backend.BackendApplication;
import com.vireocode.backend.architecture.BackendArchitectureRules;
import com.vireocode.backend.architecture.CrudArchitectureRules;
import org.junit.jupiter.api.Test;

class ReferenceFeatureArchitectureTests {
    @Test
    void theTestOnlyReferenceUsesTheSameProductionRoleContracts() {
        var graph = new ClassFileImporter().importPackages("referencefixtures.contacts");
        var application = BackendApplication.class.getPackageName();
        CrudArchitectureRules.roles(application).check(graph);
        CrudArchitectureRules.entities(application).check(graph);
        CrudArchitectureRules.sharedCrud(application).check(graph);
        CrudArchitectureRules.publishedImports(application).check(graph);
        BackendArchitectureRules.persistenceDoesNotDependOnTransport().check(graph);
    }
}
