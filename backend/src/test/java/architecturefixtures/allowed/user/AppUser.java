package architecturefixtures.allowed.user;

import jakarta.persistence.Entity;
import java.util.UUID;

@Entity
public class AppUser {
    public UUID getId() { return UUID.randomUUID(); }
    public String getUsername() { return "reader"; }
    public String getPasswordHash() { return "hash"; }
    public String getDisplayName() { return "Reader"; }
    public String getEmail() { return "reader@example.test"; }
    public boolean isEnabled() { return true; }
}
