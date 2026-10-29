package httptestfixtures;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** A future consumer endpoint outside auth, imported only by the HTTP fixture. */
@TestConfiguration(proxyBeanMethods = false)
@Import(OpenApiTestConfiguration.CatalogController.class)
public class OpenApiTestConfiguration {

    @RestController
    public static class CatalogController {
        @PostMapping("/catalog-items")
        public CatalogItem create(@Valid @RequestBody CreateCatalogItem command) {
            return new CatalogItem(command.name());
        }
    }

    record CreateCatalogItem(@NotBlank @Size(max = 60) String name) {
    }

    record CatalogItem(String name) {
    }
}
