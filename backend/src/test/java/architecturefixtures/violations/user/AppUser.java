package architecturefixtures.violations.user;

import jakarta.persistence.Entity;

@Entity
public class AppUser {
    public AppUser() { }
    public String getEmail() { return "fixture@example.test"; }
}
