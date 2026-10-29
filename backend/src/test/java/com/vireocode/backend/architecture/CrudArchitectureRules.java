package com.vireocode.backend.architecture;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;

import java.util.Set;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

/** Static role contracts; authority, predicates and transaction semantics still need behavioral proof. */
public final class CrudArchitectureRules {
    private CrudArchitectureRules() { }

    public static ArchRule publishedImports(String applicationPackage) {
        Set<String> targets = Set.of("crud.BaseEntity", "crud.SoftDeletableEntity", "crud.BaseService", "crud.DeleteMode",
                "crud.ResourceNotFoundException", "crud.VersionConflictException", "crud.ResourceInUseException", "http.PageResponse");
        return classes().should(new ArchCondition<>("consume only the published reference infrastructure") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                origin.getDirectDependenciesFromSelf().stream().filter(dependency ->
                                dependency.getTargetClass().getName().startsWith(applicationPackage + "."))
                        .filter(dependency -> !targets.contains(dependency.getTargetClass().getName()
                                .substring(applicationPackage.length() + 1)))
                        .forEach(dependency -> fail(events, dependency, "UNPUBLISHED_REFERENCE_IMPORT"));
            }
        });
    }

    public static ArchRule roles(String applicationPackage) {
        return classes().should(new ArchCondition<>("respect HTTP, service, DTO and persistence roles") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                boolean controller = origin.isAnnotatedWith("org.springframework.web.bind.annotation.RestController");
                boolean service = origin.isAnnotatedWith("org.springframework.stereotype.Service")
                        || origin.getSimpleName().endsWith("Service");
                boolean dto = origin.getSimpleName().endsWith("Request") || origin.getSimpleName().endsWith("Response");
                boolean entity = origin.isAnnotatedWith("jakarta.persistence.Entity");
                boolean repository = origin.isAssignableTo("org.springframework.data.repository.Repository");
                if (dto && !origin.isRecord()) fail(events, origin, "DTO_RECORD");
                for (var dependency : origin.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass();
                    boolean persistence = target.isAnnotatedWith("jakarta.persistence.Entity")
                            || target.isAssignableTo("org.springframework.data.repository.Repository")
                            || target.isAssignableTo(applicationPackage + ".crud.BaseEntity")
                            || target.getName().equals("jakarta.persistence.EntityManager")
                            || target.getPackageName().startsWith("org.springframework.jdbc")
                            || target.getPackageName().startsWith("java.sql");
                    boolean authRead = origin.getName().equals(applicationPackage + ".auth.AuthController")
                            && Set.of(applicationPackage + ".user.AppUser", applicationPackage + ".user.AppUserRepository")
                                    .contains(target.getName());
                    if (controller && !authRead && persistence) fail(events, dependency, "CONTROLLER_TO_PERSISTENCE");
                    if (service && (transport(target) || target.getPackageName().equals(applicationPackage + ".http")
                            && !target.getName().equals(applicationPackage + ".http.PageResponse"))) {
                        fail(events, dependency, "SERVICE_TO_HTTP");
                    }
                    if (dto && (persistence || target.getPackageName().startsWith("org.springframework.security"))) {
                        fail(events, dependency, "DTO_TO_INTERNAL_STATE");
                    }
                    if ((entity || repository) && (transport(target)
                            || target.isAnnotatedWith("org.springframework.stereotype.Service")
                            || target.getSimpleName().endsWith("Service"))) {
                        fail(events, dependency, "PERSISTENCE_TO_BUSINESS_OR_HTTP");
                    }
                }
                if ((controller || service) && !origin.getSimpleName().equals("BaseService")) {
                    origin.getFields().stream().filter(field -> !field.getModifiers().contains(JavaModifier.STATIC))
                            .filter(field -> !field.getModifiers().contains(JavaModifier.FINAL))
                            .forEach(field -> fail(events, field, "MUTABLE_INJECTED_STATE"));
                }
                origin.getFields().stream().filter(field -> field.isAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
                        || field.isAnnotatedWith("jakarta.annotation.Resource"))
                        .forEach(field -> fail(events, field, "FIELD_INJECTION"));
                for (var method : origin.getMethods()) {
                    boolean transactional = method.isAnnotatedWith("org.springframework.transaction.annotation.Transactional")
                            || origin.isAnnotatedWith("org.springframework.transaction.annotation.Transactional");
                    if (transactional && method.getModifiers().contains(JavaModifier.PUBLIC)
                            && (method.getModifiers().contains(JavaModifier.FINAL)
                            || method.getModifiers().contains(JavaModifier.STATIC)
                            || origin.getModifiers().contains(JavaModifier.FINAL))) {
                        fail(events, method, "UNPROXYABLE_TRANSACTION");
                    }
                }
            }
        });
    }

    public static ArchRule entities(String applicationPackage) {
        return classes().should(new ArchCondition<>("use controlled business entity metadata and delete capability") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                if (!origin.isAnnotatedWith("jakarta.persistence.Entity")
                        || origin.getName().equals(applicationPackage + ".user.AppUser")) return;
                if (!origin.isAssignableTo(applicationPackage + ".crud.BaseEntity")) {
                    fail(events, origin, "BUSINESS_ENTITY_BASE");
                }
                boolean metadata = origin.getAllFields().stream().anyMatch(field ->
                        field.isAnnotatedWith("jakarta.persistence.Id") && field.getRawType().isEquivalentTo(java.util.UUID.class))
                        && origin.getAllFields().stream().filter(field -> field.isAnnotatedWith("jakarta.persistence.Version")
                                && field.getRawType().isEquivalentTo(Long.class)).count() == 1
                        && origin.getAllFields().stream().anyMatch(field -> field.getName().equals("createdAt")
                                && field.getRawType().isEquivalentTo(java.time.Instant.class))
                        && origin.getAllFields().stream().anyMatch(field -> field.getName().equals("updatedAt")
                                && field.getRawType().isEquivalentTo(java.time.Instant.class));
                if (!metadata) fail(events, origin, "BUSINESS_ENTITY_METADATA");
                if (origin.isAssignableTo(applicationPackage + ".crud.SoftDeletableEntity")
                        && !origin.isAnnotatedWith("org.hibernate.annotations.SQLRestriction")) {
                    fail(events, origin, "SOFT_ACTIVE_RESTRICTION");
                }
                if (origin.isAnnotatedWith("org.hibernate.annotations.SoftDelete")) {
                    fail(events, origin, "CONFLICTING_SOFT_DELETE");
                }
                boolean protectedNoArg = origin.getConstructors().stream().anyMatch(constructor ->
                        constructor.getRawParameterTypes().isEmpty()
                                && constructor.getModifiers().contains(JavaModifier.PROTECTED));
                if (!protectedNoArg) fail(events, origin, "ENTITY_JPA_CONSTRUCTOR");
            }
        });
    }

    public static ArchRule sharedCrud(String applicationPackage) {
        Set<String> published = Set.of("BaseEntity", "SoftDeletableEntity", "BaseService", "DeleteMode",
                "ResourceNotFoundException", "VersionConflictException", "ResourceInUseException");
        return classes().should(new ArchCondition<>("keep CRUD infrastructure narrow and independent") {
            @Override
            public void check(JavaClass origin, ConditionEvents events) {
                boolean crud = origin.getPackageName().equals(applicationPackage + ".crud");
                for (var dependency : origin.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass();
                    if (crud && target.getPackageName().startsWith(applicationPackage + ".")
                            && !target.getPackageName().equals(applicationPackage + ".crud")) {
                        fail(events, dependency, "CRUD_TO_FEATURE");
                    }
                    if (!crud && target.getPackageName().equals(applicationPackage + ".crud")
                            && !published.contains(target.getSimpleName())) {
                        fail(events, dependency, "INTERNAL_CRUD_TYPE");
                    }
                }
                if (origin.getName().equals(applicationPackage + ".crud.BaseService")) {
                    origin.getMethods().stream().filter(method -> method.getModifiers().contains(JavaModifier.PUBLIC))
                            .forEach(method -> fail(events, method, "PUBLIC_BASE_MUTATION_BYPASS"));
                }
                if (Set.of("BaseEntity", "SoftDeletableEntity").contains(origin.getSimpleName()) && crud) {
                    origin.getMethods().stream().filter(method -> method.getName().startsWith("set")
                                    && method.getModifiers().contains(JavaModifier.PUBLIC))
                            .forEach(method -> fail(events, method, "PUBLIC_METADATA_SETTER"));
                }
            }
        });
    }

    private static boolean transport(JavaClass target) {
        return target.getPackageName().startsWith("jakarta.servlet")
                || target.getPackageName().startsWith("org.springframework.web")
                || target.getPackageName().startsWith("org.springframework.http")
                || target.isAnnotatedWith("org.springframework.web.bind.annotation.RestController")
                || target.isAnnotatedWith("org.springframework.web.bind.annotation.RestControllerAdvice");
    }

    private static void fail(ConditionEvents events, Object source, String code) {
        events.add(SimpleConditionEvent.violated(source, code + ": " + source));
    }
}
