package referencefixtures.contacts;

import java.time.Instant;
import java.util.UUID;

public record ContactResponse(UUID id, String code, String displayName, String note,
UUID groupId, String groupName, Instant createdAt, Instant updatedAt, Long version) {
}
