package architecturefixtures.violations.auth;

import architecturefixtures.violations.user.AppUser;
import java.util.function.Function;
import java.util.function.Supplier;

public class SecurityConfiguration {
    public Function<AppUser, String> forbiddenGetterReference() { return AppUser::getEmail; }
    public AppUser forbiddenConstructorCall() { return new AppUser(); }
    public Supplier<AppUser> forbiddenConstructorReference() { return AppUser::new; }
}
