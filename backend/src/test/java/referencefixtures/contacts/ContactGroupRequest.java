package referencefixtures.contacts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactGroupRequest(@NotBlank @Size(max = 100) String name) {
}
