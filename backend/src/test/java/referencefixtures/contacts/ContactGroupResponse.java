package referencefixtures.contacts;

import java.time.Instant;
import java.util.UUID;

public record ContactGroupResponse(UUID id, String name, Instant createdAt, Instant updatedAt, Long version) {
}
