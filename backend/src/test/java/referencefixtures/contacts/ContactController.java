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
@RequestMapping(value = "/reference/contact-groups/{groupId}/contacts", produces = "application/json")
public class ContactController {
    private final ContactService contacts;
    public ContactController(ContactService contacts) {
        this.contacts = contacts;
    }

    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @Operation(description = "Create a contact. Mutation also requires the current csrfToken.",
    responses = {
        @ApiResponse(responseCode = "201", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ContactResponse.class))),
        @ApiResponse(responseCode = "409", description = "REQUEST_REJECTED: code is reserved in this group",
                content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError")))
    })
    public ResponseEntity<ContactResponse> create(Principal actor, @PathVariable UUID groupId, @Valid @RequestBody ContactRequest request) {
        var response = ReferenceHttp.uniqueContactWrite(() -> contacts.create(ReferenceHttp.actor(actor), groupId, request));
        return ResponseEntity.created(URI.create("/api/reference/contact-groups/" + groupId + "/contacts/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    @Operation(responses = @ApiResponse(responseCode = "404", description = "RESOURCE_NOT_FOUND",
            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError"))))
    public ContactResponse read(Principal actor, @PathVariable UUID groupId, @PathVariable UUID id) {
        return contacts.read(ReferenceHttp.actor(actor), groupId, id);
    }

    @GetMapping
    public PageResponse<ContactResponse> list(Principal actor, @PathVariable UUID groupId,
    @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "displayName") String sort, @RequestParam(defaultValue = "asc") String direction,
    @RequestParam(defaultValue = "") String search) {
        return ReferenceHttp.input(() -> contacts.list(ReferenceHttp.actor(actor), groupId, page, size, sort, direction, search));
    }

    @PutMapping("/{id}")
    @Operation(description = "Full replacement, including clearing a null note. 409 VERSION_CONFLICT retains the client's draft.")
    public ContactResponse update(Principal actor, @PathVariable UUID groupId, @PathVariable UUID id,
    @Parameter(required = true, description = "Nonnegative entity version", schema = @Schema(type = "integer", format = "int64", minimum = "0"))
    @RequestHeader("X-Expected-Version") String version, @Valid @RequestBody ContactRequest request) {
        var expected = ReferenceHttp.version(version);
        return ReferenceHttp.uniqueContactWrite(() -> contacts.update(ReferenceHttp.actor(actor), groupId, id, expected, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @Operation(description = "Soft delete. 404 RESOURCE_NOT_FOUND, 409 VERSION_CONFLICT.")
    public ResponseEntity<Void> delete(Principal actor, @PathVariable UUID groupId, @PathVariable UUID id,
    @Parameter(required = true, description = "Nonnegative entity version", schema = @Schema(type = "integer", format = "int64", minimum = "0"))
    @RequestHeader("X-Expected-Version") String version) {
        contacts.delete(ReferenceHttp.actor(actor), groupId, id, ReferenceHttp.version(version));
        return ResponseEntity.noContent().build();
    }
}
