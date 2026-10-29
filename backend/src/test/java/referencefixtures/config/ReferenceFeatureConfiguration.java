package referencefixtures.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import referencefixtures.contacts.ContactController;
import referencefixtures.contacts.ContactGroupController;
import referencefixtures.contacts.ContactGroupService;
import referencefixtures.contacts.ContactService;

/** Explicit-only registration: outside the application's component/JPA scan roots. */
@TestConfiguration(proxyBeanMethods = false)
@Import({
    ContactController.class, ContactGroupController.class, ContactService.class, ContactGroupService.class
})
public class ReferenceFeatureConfiguration {
}
