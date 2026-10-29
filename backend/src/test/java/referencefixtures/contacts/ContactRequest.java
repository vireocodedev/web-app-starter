package referencefixtures.contacts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The same writable fields and validation apply to POST and full-replacement PUT. */
public record ContactRequest(@NotBlank @Size(max = 40) String code,
@NotBlank @Size(max = 120) String displayName, @Size(max = 500) String note) {
}
