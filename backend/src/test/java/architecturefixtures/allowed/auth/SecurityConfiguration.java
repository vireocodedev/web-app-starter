package architecturefixtures.allowed.auth;

import architecturefixtures.allowed.user.AppUserRepository;

public class SecurityConfiguration {
    public String details(AppUserRepository users) {
        var user = users.findByUsername("reader").orElseThrow();
        return user.getUsername() + user.getPasswordHash() + user.isEnabled();
    }
}
