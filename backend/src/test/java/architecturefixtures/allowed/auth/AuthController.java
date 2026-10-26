package architecturefixtures.allowed.auth;

import architecturefixtures.allowed.user.AppUserRepository;

public class AuthController {
    public SessionUser session(AppUserRepository users) {
        var user = users.findByUsername("reader").filter(candidate -> candidate.isEnabled()).orElseThrow();
        return new SessionUser(user.getId().toString(), user.getDisplayName(), user.getEmail());
    }

    public record SessionUser(String id, String displayName, String email) { }
}
