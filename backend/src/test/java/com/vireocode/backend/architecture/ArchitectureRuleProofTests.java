package com.vireocode.backend.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import architecturefixtures.allowed.auth.AuthController;
import architecturefixtures.allowed.auth.SecurityConfiguration;
import architecturefixtures.allowed.user.AppUser;
import architecturefixtures.allowed.user.AppUserRepository;
import architecturefixtures.allowed.user.UserInitializer;
import architecturefixtures.allowed.user.internal.UserProjection;
import architecturefixtures.support.SharedData;
import architecturefixtures.violations.auth.UndeclaredHelper;
import architecturefixtures.violations.invoice.BootstrapDependency;
import architecturefixtures.violations.invoice.ForeignRepository;
import architecturefixtures.violations.invoice.GenericEntityLeak;
import architecturefixtures.violations.invoice.TestDependency;
import architecturefixtures.violations.user.ReverseAuth;
import architecturefixtures.violations.user.RoleReversals;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArchitectureRuleProofTests {

    private static final String ALLOWED = "architecturefixtures.allowed";
    private static final String VIOLATIONS = "architecturefixtures.violations";

    @Test
    void rejectsAnEmptyImportedClassSet() {
        JavaClasses emptyClasses = importClasses();
        assertThatThrownBy(() -> BackendArchitectureRules.featureBoundaries(ALLOWED).check(emptyClasses))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("failed to check any classes");
    }

    @Test
    void rejectsAnEmptyTestOutputInventory() {
        assertThatThrownBy(() -> BackendArchitectureRules.productionDoesNotDependOnTests(Set.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Test output inventory must not be empty");
    }

    @Test
    void permitsExactAuthenticationReadsInferredEntityTypesAndFrameworkInjection() {
        JavaClasses classes = importClasses(architecturefixtures.allowed.BackendApplication.class,
                AuthController.class, AuthController.SessionUser.class,
                SecurityConfiguration.class, AppUser.class, AppUserRepository.class,
                UserInitializer.class, UserProjection.class);
        BackendArchitectureRules.featureBoundaries(ALLOWED).check(classes);
        BackendArchitectureRules.authenticationReads(ALLOWED, classes.get(AppUserRepository.class)).check(classes);
        BackendArchitectureRules.persistenceDoesNotDependOnTransport().check(classes);
    }

    @Test
    void rejectsAnotherFeaturesRepository() {
        assertFeatureViolation(ForeignRepository.class, "AppUserRepository");
    }

    @Test
    void rejectsAnEntityFoundOnlyInAGenericReturnSignature() {
        assertFeatureViolation(GenericEntityLeak.class, "AppUser", "generic return type");
    }

    @Test
    void rejectsReverseUserToAuthenticationDependency() {
        assertFeatureViolation(ReverseAuth.class, "SecurityConfiguration");
    }

    @Test
    void rejectsAnUndeclaredHelperInsideTheOtherwiseAllowedAuthenticationPackage() {
        assertFeatureViolation(UndeclaredHelper.class, "AppUserRepository");
    }

    @Test
    void rejectsFeatureToBootstrapDependency() {
        assertViolation(BackendArchitectureRules.featureBoundaries(VIOLATIONS), BootstrapDependency.class,
                "FEATURE_TO_BOOTSTRAP", "BackendApplication");
    }

    @Test
    void rejectsUndeclaredBasePackageTypes() {
        assertViolation(BackendArchitectureRules.featureBoundaries(VIOLATIONS),
                architecturefixtures.violations.MisplacedService.class,
                "UNDECLARED_BASE_PACKAGE_TYPE", "MisplacedService");
    }

    @Test
    void bootstrapCannotLaunderBusinessRepositoryAccess() {
        assertViolation(BackendArchitectureRules.featureBoundaries(VIOLATIONS),
                architecturefixtures.violations.BackendApplication.class,
                "BOOTSTRAP_TO_FEATURE", "AppUserRepository");
    }

    @Test
    void rejectsTestOutputWithoutDependingOnATestClassNamingConvention() {
        assertThat(SharedData.class.getProtectionDomain().getCodeSource().getLocation())
                .isEqualTo(ArchitectureRuleProofTests.class.getProtectionDomain().getCodeSource().getLocation());
        assertViolation(BackendArchitectureRules.productionDoesNotDependOnTests(Set.of(SharedData.class.getName())),
                TestDependency.class, "PRODUCTION_TO_TEST", "SharedData");
    }

    @Test
    void rejectsRepositoryToControllerServletAndSecurityConfiguration() {
        List<String> violations = violations(BackendArchitectureRules.persistenceDoesNotDependOnTransport(),
                RoleReversals.BadRepository.class);
        assertThat(violations).hasSize(3);
        assertThat(violations).allMatch(message -> message.contains("PERSISTENCE_TO_TRANSPORT"));
        assertThat(violations).anyMatch(message -> message.contains("UserController"));
        assertThat(violations).anyMatch(message -> message.contains("HttpServletRequest"));
        assertThat(violations).anyMatch(message -> message.contains("UserSecurityConfiguration"));
    }

    @Test
    void rejectsEntityToController() {
        assertViolation(BackendArchitectureRules.persistenceDoesNotDependOnTransport(), RoleReversals.BadEntity.class,
                "PERSISTENCE_TO_TRANSPORT", "UserController");
    }

    @Test
    void rejectsInheritedRepositorySaveWithoutAnEntityConstructorViolation() {
        List<String> violations = violations(authenticationViolationRule(),
                architecturefixtures.violations.auth.AuthController.class);
        assertThat(violations).allSatisfy(message -> assertThat(message)
                .contains("AUTH_REPOSITORY_OPERATION").doesNotContain("AUTH_ENTITY_OPERATION", "<init>"));
        assertThat(violations.stream().filter(message -> message.contains(".write(")))
                .singleElement().satisfies(message -> assertThat(message).contains(".save("));
    }

    @Test
    void rejectsInheritedQueryApiOperationsAfterAnExplicitUpcast() {
        assertQueryOperationsRejected("upcastQuery");
    }

    @Test
    void rejectsInheritedQueryApiOperationsAcceptedAsADirectParameter() {
        assertQueryOperationsRejected("directQuery");
    }

    @Test
    void rejectsForbiddenEntityGetterAndConstructorReferencesAsWellAsConstructorCalls() {
        List<String> violations = violations(authenticationViolationRule(),
                architecturefixtures.violations.auth.SecurityConfiguration.class);
        assertThat(violations).hasSize(3);
        assertThat(violations).allMatch(message -> message.contains("AUTH_ENTITY_OPERATION"));
        assertThat(violations).anyMatch(message -> message.contains("references method") && message.contains(".getEmail()"));
        assertThat(violations).anyMatch(message -> message.contains("references constructor") && message.contains("<init>"));
        assertThat(violations).anyMatch(message -> message.contains("calls constructor") && message.contains("<init>"));
    }

    @Test
    void permitsOnlyThePublishedHttpErrorConsumersAndTheirOperations() {
        String application = "architecturefixtures.errorsallowed";
        JavaClasses classes = importClasses(
                architecturefixtures.errorsallowed.http.ApiErrors.class,
                architecturefixtures.errorsallowed.auth.SecurityConfiguration.class,
                architecturefixtures.errorsallowed.auth.AuthExceptionHandler.class);
        BackendArchitectureRules.featureBoundaries(application).check(classes);
        BackendArchitectureRules.httpErrorOperations(application).check(classes);
    }

    @Test
    void rejectsAnotherAuthenticationClassUsingTheErrorSeam() {
        Class<?> helper = architecturefixtures.errorsdenied.auth.UndeclaredHelper.class;
        String application = "architecturefixtures.errorsdenied";
        assertViolation(BackendArchitectureRules.featureBoundaries(application), helper,
                "UNDECLARED_FEATURE_EDGE", "ApiErrors");
        assertViolation(BackendArchitectureRules.httpErrorOperations(application), helper,
                "HTTP_ERROR_OPERATION", "authenticationFailure");
    }

    @Test
    void rejectsDependingOnTheInternalGlobalAdviceEvenFromAnApprovedConsumer() {
        assertViolation(BackendArchitectureRules.featureBoundaries("architecturefixtures.errorsdenied"),
                architecturefixtures.errorsdenied.auth.SecurityConfiguration.class,
                "UNDECLARED_FEATURE_EDGE", "ApiExceptionHandler");
    }

    @Test
    void rejectsCallingAnErrorFactoryPublishedOnlyToTheOtherConsumer() {
        assertViolation(BackendArchitectureRules.httpErrorOperations("architecturefixtures.errorsdenied"),
                architecturefixtures.errorsdenied.auth.SecurityConfiguration.class,
                "HTTP_ERROR_OPERATION", "authenticationFailure");
    }

    @Test
    void rejectsErrorWritersConstructorReferencesAndFieldAccessesFromTheAuthAdvice() {
        List<String> violations = violations(
                BackendArchitectureRules.httpErrorOperations("architecturefixtures.errorsdenied"),
                architecturefixtures.errorsdenied.auth.AuthExceptionHandler.class);
        assertThat(violations).hasSize(3).allMatch(message -> message.contains("HTTP_ERROR_OPERATION"));
        assertThat(violations).anyMatch(message -> message.contains("writeAccessDenied"));
        assertThat(violations).anyMatch(message -> message.contains("references constructor"));
        assertThat(violations).anyMatch(message -> message.contains("INTERNAL"));
    }

    @Test
    void permitsAcyclicFeatureDependenciesAndCyclesInsideOneFeature() {
        JavaClasses classes = importClasses(
                architecturefixtures.cycleallowed.alpha.AlphaNode.class,
                architecturefixtures.cycleallowed.alpha.internal.InternalNode.class,
                architecturefixtures.cycleallowed.beta.BetaNode.class,
                architecturefixtures.cycleallowed.gamma.GammaNode.class);
        BackendArchitectureRules.featureCycles("architecturefixtures.cycleallowed").check(classes);
    }

    @Test
    void rejectsDirectFeatureCycles() {
        JavaClasses classes = importClasses(
                architecturefixtures.cycletwo.alpha.AlphaNode.class,
                architecturefixtures.cycletwo.beta.BetaNode.class);
        assertCycleViolation("architecturefixtures.cycletwo", classes,
                "alpha ->", "beta ->", "AlphaNode", "BetaNode");
    }

    @Test
    void rejectsIndirectFeatureCyclesAcrossNestedPackages() {
        JavaClasses classes = importClasses(
                architecturefixtures.cyclethree.alpha.internal.AlphaNode.class,
                architecturefixtures.cyclethree.beta.BetaNode.class,
                architecturefixtures.cyclethree.gamma.internal.GammaNode.class);
        assertCycleViolation("architecturefixtures.cyclethree", classes,
                "alpha ->", "beta ->", "gamma ->", "alpha.internal.AlphaNode", "gamma.internal.GammaNode");
    }

    @Test
    void rejectsFeatureCyclesVisibleOnlyThroughGenericSignatures() {
        JavaClasses classes = importClasses(
                architecturefixtures.cyclegeneric.alpha.AlphaNode.class,
                architecturefixtures.cyclegeneric.beta.BetaNode.class);
        assertCycleViolation("architecturefixtures.cyclegeneric", classes,
                "alpha ->", "beta ->", "AlphaNode", "BetaNode", "java.util.List");
    }

    @Test
    void rejectsEmptyCycleInput() {
        assertThatThrownBy(() -> BackendArchitectureRules.featureCycles("architecturefixtures.cycleallowed")
                .check(importClasses()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("failed to check any classes");
    }

    @Test
    void rejectsCycleInputOutsideApplicationFeatures() {
        assertThatThrownBy(() -> BackendArchitectureRules.featureCycles("architecturefixtures.cycleallowed")
                .check(importClasses(SharedData.class)))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("failed to check any classes");
    }

    private static void assertCycleViolation(String applicationPackage, JavaClasses classes, String... details) {
        // Evaluate only this rule: a forbidden-edge failure must not stand in for cycle detection.
        List<String> violations = BackendArchitectureRules.featureCycles(applicationPackage)
                .evaluate(classes).getFailureReport().getDetails();
        assertThat(violations).isNotEmpty().allMatch(message -> message.contains("Cycle detected"));
        for (String detail : details) {
            assertThat(violations).anyMatch(message -> message.contains(detail));
        }
    }

    private static void assertQueryOperationsRejected(String originMethod) {
        List<String> violations = violations(authenticationViolationRule(),
                architecturefixtures.violations.auth.AuthController.class).stream()
                .filter(message -> message.contains("." + originMethod + "("))
                .toList();
        assertThat(violations).hasSize(3).allSatisfy(message -> assertThat(message)
                .contains("AUTH_REPOSITORY_OPERATION", "QueryByExampleExecutor")
                .doesNotContain("AUTH_ENTITY_OPERATION", "<init>"));
        for (String operation : List.of("findAll", "count", "exists")) {
            assertThat(violations).anyMatch(message -> message.contains("." + operation + "("));
        }
    }

    private static ArchRule authenticationViolationRule() {
        JavaClasses repository = importClasses(architecturefixtures.violations.user.AppUserRepository.class);
        return BackendArchitectureRules.authenticationReads(VIOLATIONS,
                repository.get(architecturefixtures.violations.user.AppUserRepository.class));
    }

    private static void assertFeatureViolation(Class<?> fixture, String... details) {
        assertViolation(BackendArchitectureRules.featureBoundaries(VIOLATIONS), fixture,
                "UNDECLARED_FEATURE_EDGE", details);
    }

    private static void assertViolation(ArchRule rule, Class<?> fixture, String category, String... details) {
        List<String> violations = violations(rule, fixture);
        assertThat(violations).isNotEmpty().allSatisfy(message -> assertThat(message).contains(category));
        for (String detail : details) {
            assertThat(violations).anyMatch(message -> message.contains(detail));
        }
    }

    private static List<String> violations(ArchRule rule, Class<?> fixture) {
        return rule.evaluate(importClasses(fixture)).getFailureReport().getDetails();
    }

    private static JavaClasses importClasses(Class<?>... fixtures) {
        // Explicit classes prevent negative fixtures from leaking into the application import.
        return new ClassFileImporter().importClasses(fixtures);
    }
}
