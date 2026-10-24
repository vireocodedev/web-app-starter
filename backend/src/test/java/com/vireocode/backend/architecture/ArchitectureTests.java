package com.vireocode.backend.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.vireocode.backend.BackendApplication;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class ArchitectureTests {

    private static final String APPLICATION_PACKAGE = BackendApplication.class.getPackageName();
    private static JavaClasses productionClasses;
    private static Set<String> testClassNames;

    @BeforeAll
    static void importCompleteMainOutput() throws IOException, URISyntaxException {
        // Deliberately delayed: Gradle ciTestInventory discovers these tests without importing bytecode.
        Path mainOutput = outputDirectory(BackendApplication.class);
        Path testOutput = outputDirectory(ArchitectureTests.class);
        assertThat(mainOutput).as("main and test output must be separate").isNotEqualTo(testOutput);
        Set<String> mainClassNames = classNames(mainOutput);
        testClassNames = classNames(testOutput);
        assertThat(mainClassNames).isNotEmpty().contains(BackendApplication.class.getName());
        assertThat(testClassNames).isNotEmpty().contains(ArchitectureTests.class.getName());
        assertThat(mainClassNames).doesNotContainAnyElementsOf(testClassNames);

        productionClasses = new ClassFileImporter().importPath(mainOutput);
        assertThat(productionClasses.stream().map(type -> type.getName()).collect(Collectors.toSet()))
                .as("every compiled main class must participate, including nested and future feature classes")
                .containsExactlyInAnyOrderElementsOf(mainClassNames);
        assertThat(productionClasses.stream().map(type -> type.getName()))
                .noneMatch(testClassNames::contains);
        assertThat(productionClasses).allSatisfy(type -> {
            assertThat(type.getSource()).isPresent();
            assertThat(Path.of(type.getSource().orElseThrow().getUri()).startsWith(mainOutput))
                    .as("%s must come from main output", type.getName()).isTrue();
        });
    }

    @Test
    void featureDependenciesMatchThePublishedContract() {
        BackendArchitectureRules.featureBoundaries(APPLICATION_PACKAGE).check(productionClasses);
    }

    @Test
    void featurePackagesAreFreeOfCycles() {
        BackendArchitectureRules.featureCycles(APPLICATION_PACKAGE).check(productionClasses);
    }

    @Test
    void authenticationUsesOnlyItsPublishedUserReads() {
        BackendArchitectureRules.authenticationReads(APPLICATION_PACKAGE,
                productionClasses.get(APPLICATION_PACKAGE + ".user.AppUserRepository")).check(productionClasses);
    }

    @Test
    void authenticationUsesOnlyItsPublishedHttpErrorOperations() {
        BackendArchitectureRules.httpErrorOperations(APPLICATION_PACKAGE).check(productionClasses);
    }

    @Test
    void productionCannotDependOnTestOutput() {
        BackendArchitectureRules.productionDoesNotDependOnTests(testClassNames).check(productionClasses);
    }

    @Test
    void persistenceCannotDependOnHttpOrSecurityConfiguration() {
        BackendArchitectureRules.persistenceDoesNotDependOnTransport().check(productionClasses);
    }

    private static Path outputDirectory(Class<?> anchor) throws URISyntaxException {
        Path output = Path.of(anchor.getProtectionDomain().getCodeSource().getLocation().toURI());
        assertThat(output).as("architecture tests require compiled class directories").isDirectory();
        return output;
    }

    private static Set<String> classNames(Path output) throws IOException {
        try (var files = Files.walk(output)) {
            return files.filter(Files::isRegularFile)
                    .filter(file -> file.toString().endsWith(".class"))
                    .map(output::relativize)
                    .map(Path::toString)
                    .map(name -> name.substring(0, name.length() - ".class".length()).replace('/', '.').replace('\\', '.'))
                    .collect(Collectors.toSet());
        }
    }
}
