package architecturefixtures.allowed.user.internal;

import architecturefixtures.allowed.user.AppUser;

public class UserProjection {
    public String name(AppUser user) { return user.getDisplayName(); }
}
