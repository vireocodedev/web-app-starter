package referencefixtures.contacts;

import java.net.URI;
import java.security.Principal;
import java.util.UUID;
import com.vireocode.backend.http.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/reference/contact-groups", produces = "application/json")
public class ContactGroupController {
    private final ContactGroupService groups;
    public ContactGroupController(ContactGroupService groups) {
        this.groups = groups;
    }

    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @ApiResponse(responseCode = "201", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ContactGroupResponse.class)))
    public ResponseEntity<ContactGroupResponse> create(Principal actor, @Valid @RequestBody ContactGroupRequest request) {
        var response = groups.create(ReferenceHttp.actor(actor), request);
        return ResponseEntity.created(URI.create("/api/reference/contact-groups/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public ContactGroupResponse read(Principal actor, @PathVariable UUID id) {
        return groups.read(ReferenceHttp.actor(actor), id);
    }

    @GetMapping
    public PageResponse<ContactGroupResponse> list(Principal actor, @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "name") String sort,
    @RequestParam(defaultValue = "asc") String direction) {
        return ReferenceHttp.input(() -> groups.list(ReferenceHttp.actor(actor), page, size, sort, direction));
    }

    @PutMapping("/{id}")
    @Operation(description = "Full replacement. 404 RESOURCE_NOT_FOUND, 409 VERSION_CONFLICT.")
    public ContactGroupResponse update(Principal actor, @PathVariable UUID id,
    @Parameter(required = true, description = "Nonnegative entity version", schema = @Schema(type = "integer", format = "int64", minimum = "0"))
    @RequestHeader("X-Expected-Version") String version, @Valid @RequestBody ContactGroupRequest request) {
        return groups.update(ReferenceHttp.actor(actor), id, ReferenceHttp.version(version), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @Operation(description = "Hard delete. Retained contacts produce 409 RESOURCE_IN_USE; stale version produces 409 VERSION_CONFLICT.")
    public ResponseEntity<Void> delete(Principal actor, @PathVariable UUID id,
    @Parameter(required = true, description = "Nonnegative entity version", schema = @Schema(type = "integer", format = "int64", minimum = "0"))
    @RequestHeader("X-Expected-Version") String version) {
        groups.delete(ReferenceHttp.actor(actor), id, ReferenceHttp.version(version));
        return ResponseEntity.noContent().build();
    }
}
