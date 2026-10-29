package com.vireocode.backend.architecture;

import com.tngtech.archunit.core.domain.JavaAccess;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/** The documented backend contract, parameterized only to run it against isolated proof fixtures. */
public final class BackendArchitectureRules {

    private BackendArchitectureRules() {
    }

    static ArchRule featureCycles(String applicationPackage) {
        return slices().matching(applicationPackage + ".(*)..")
                .namingSlices("$1")
                .should().beFreeOfCycles()
                .allowEmptyShould(false);
    }

    static ArchRule featureBoundaries(String applicationPackage) {
        return classes().should(new ArchCondition<>("respect the documented feature boundaries") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                if (!inside(origin, applicationPackage)) {
                    violation(events, origin, "APPLICATION_PACKAGE: " + origin.getName()
                            + " is outside " + applicationPackage);
                    return;
                }
                String originFeature = feature(origin, applicationPackage);
                if (originFeature.isEmpty()
                        && !origin.getName().equals(applicationPackage + ".BackendApplication")) {
                    violation(events, origin, "UNDECLARED_BASE_PACKAGE_TYPE: " + origin.getName()
                            + " must belong to a feature; only BackendApplication owns bootstrap composition");
                }
                for (var dependency : origin.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass();
                    if (!inside(target, applicationPackage)) {
                        continue;
                    }
                    String targetFeature = feature(target, applicationPackage);
                    if (originFeature.isEmpty()) {
                        if (!targetFeature.isEmpty()) {
                            violation(events, dependency, "BOOTSTRAP_TO_FEATURE: " + dependency.getDescription());
                        }
                    } else if (targetFeature.isEmpty()) {
                        violation(events, dependency, "FEATURE_TO_BOOTSTRAP: " + dependency.getDescription());
                    } else if (!originFeature.equals(targetFeature)
                            && !publishedPair(origin, target, applicationPackage)) {
                        violation(events, dependency, "UNDECLARED_FEATURE_EDGE: " + dependency.getDescription());
                    }
                }
            }
        });
    }

    static ArchRule authenticationReads(String applicationPackage, JavaClass userRepository) {
        if (!userRepository.getName().equals(applicationPackage + ".user.AppUserRepository")) {
            throw new IllegalArgumentException("Authentication rules require the owning AppUserRepository model");
        }
        Set<String> repositoryApiOwners = new HashSet<>();
        repositoryApiOwners.add(userRepository.getName());
        userRepository.getAllRawInterfaces().forEach(type -> repositoryApiOwners.add(type.getName()));
        userRepository.getAllRawSuperclasses().stream()
                .filter(type -> !type.getName().equals("java.lang.Object"))
                .forEach(type -> repositoryApiOwners.add(type.getName()));
        Map<String, Set<String>> entityReads = Map.of(
                applicationPackage + ".auth.AuthController", Set.of("isEnabled", "getId", "getDisplayName", "getEmail"),
                applicationPackage + ".auth.SecurityConfiguration", Set.of("getUsername", "getPasswordHash", "isEnabled"));
        return classes().should(new ArchCondition<>("use only the published authentication read operations") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                Set<String> reads = entityReads.get(origin.getName());
                if (reads == null) {
                    return;
                }
                // Accesses include field accesses, ordinary calls, and method/constructor references.
                for (JavaAccess<?> access : origin.getAccessesFromSelf()) {
                    JavaClass owner = access.getTarget().getOwner();
                    String member = access.getTarget().getFullName();
                    // Inherited APIs need not extend Repository themselves (e.g. query-by-example).
                    // Use the actual repository model even when the caller accepts that API directly.
                    boolean repository = repositoryApiOwners.contains(owner.getName())
                            || owner.isAssignableTo("org.springframework.data.repository.Repository");
                    if (repository && !member.endsWith(".findByUsername(java.lang.String)")) {
                        violation(events, access, "AUTH_REPOSITORY_OPERATION: " + access.getDescription());
                    }
                    if (owner.getName().equals(applicationPackage + ".user.AppUser")
                            && reads.stream().noneMatch(read -> member.endsWith("." + read + "()"))) {
                        violation(events, access, "AUTH_ENTITY_OPERATION: " + access.getDescription());
                    }
                }
            }
        });
    }

    static ArchRule productionDoesNotDependOnTests(Set<String> testClassNames) {
        Set<String> testInventory = Set.copyOf(testClassNames);
        if (testInventory.isEmpty()) {
            throw new IllegalArgumentException("Test output inventory must not be empty");
        }
        return classes().should(new ArchCondition<>("avoid dependencies on compiled test output") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                for (var dependency : origin.getDirectDependenciesFromSelf()) {
                    if (testInventory.contains(dependency.getTargetClass().getName())) {
                        violation(events, dependency, "PRODUCTION_TO_TEST: " + dependency.getDescription());
                    }
                }
            }
        });
    }

    static ArchRule httpErrorOperations(String applicationPackage) {
        Map<String, Set<String>> operations = Map.of(
                applicationPackage + ".auth.SecurityConfiguration", Set.of(
                        ".writeAuthenticationRequired(jakarta.servlet.http.HttpServletResponse)",
                        ".writeAccessDenied(jakarta.servlet.http.HttpServletResponse, boolean)"),
                applicationPackage + ".auth.AuthExceptionHandler", Set.of(
                        ".authenticationFailure()", ".authenticationUnavailable()", ".validationFailure(java.util.Map)"));
        return classes().should(new ArchCondition<>("use only the published HTTP error operations") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                if (inside(origin, applicationPackage) && feature(origin, applicationPackage).equals("http")) {
                    return;
                }
                Set<String> allowed = operations.getOrDefault(origin.getName(), Set.of());
                for (JavaAccess<?> access : origin.getAccessesFromSelf()) {
                    if (access.getTarget().getOwner().getName().equals(applicationPackage + ".http.ApiErrors")
                            && allowed.stream().noneMatch(operation -> access.getTarget().getFullName()
                                    .equals(applicationPackage + ".http.ApiErrors" + operation))) {
                        violation(events, access, "HTTP_ERROR_OPERATION: " + access.getDescription());
                    }
                }
            }
        });
    }

    public static ArchRule persistenceDoesNotDependOnTransport() {
        return classes().should(new ArchCondition<>("keep repositories and entities independent of HTTP and security configuration") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                if (!origin.isAnnotatedWith("jakarta.persistence.Entity")
                        && !origin.isAssignableTo("org.springframework.data.repository.Repository")
                        && !origin.getSimpleName().endsWith("Repository")) {
                    return;
                }
                for (var dependency : origin.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass();
                    if (target.isAnnotatedWith("org.springframework.web.bind.annotation.RestController")
                            || target.isAnnotatedWith("org.springframework.stereotype.Controller")
                            || target.isAnnotatedWith("org.springframework.web.bind.annotation.RestControllerAdvice")
                            || target.getSimpleName().endsWith("Controller")
                            || target.getPackageName().startsWith("jakarta.servlet")
                            || target.getPackageName().startsWith("org.springframework.security.config")
                            || target.getSimpleName().endsWith("SecurityConfiguration")) {
                        violation(events, dependency, "PERSISTENCE_TO_TRANSPORT: " + dependency.getDescription());
                    }
                }
            }
        });
    }

    private static boolean publishedPair(JavaClass origin, JavaClass target, String applicationPackage) {
        Set<String> bases = Set.of("BaseEntity", "SoftDeletableEntity", "BaseService", "DeleteMode");
        Set<String> failures = Set.of("ResourceNotFoundException", "VersionConflictException", "ResourceInUseException");
        if (target.getPackageName().equals(applicationPackage + ".crud")) {
            if (origin.getPackageName().equals(applicationPackage + ".http")) {
                return origin.getName().equals(applicationPackage + ".http.ApiExceptionHandler")
                        && failures.contains(target.getSimpleName());
            }
            return bases.contains(target.getSimpleName()) || failures.contains(target.getSimpleName());
        }
        if (target.getName().equals(applicationPackage + ".http.PageResponse")) {
            return !feature(origin, applicationPackage).equals("crud");
        }
        boolean consumer = origin.getName().equals(applicationPackage + ".auth.AuthController")
                || origin.getName().equals(applicationPackage + ".auth.SecurityConfiguration");
        boolean publishedTarget = target.getName().equals(applicationPackage + ".user.AppUser")
                || target.getName().equals(applicationPackage + ".user.AppUserRepository");
        boolean errorConsumer = origin.getName().equals(applicationPackage + ".auth.SecurityConfiguration")
                || origin.getName().equals(applicationPackage + ".auth.AuthExceptionHandler");
        return (consumer && publishedTarget)
                || (errorConsumer && target.getName().equals(applicationPackage + ".http.ApiErrors"));
    }

    private static boolean inside(JavaClass type, String applicationPackage) {
        return type.getPackageName().equals(applicationPackage)
                || type.getPackageName().startsWith(applicationPackage + ".");
    }

    private static String feature(JavaClass type, String applicationPackage) {
        if (type.getPackageName().equals(applicationPackage)) {
            return "";
        }
        return type.getPackageName().substring(applicationPackage.length() + 1).split("\\.", 2)[0];
    }

    private static void violation(ConditionEvents events, Object object, String message) {
        events.add(SimpleConditionEvent.violated(object, message));
    }
}
