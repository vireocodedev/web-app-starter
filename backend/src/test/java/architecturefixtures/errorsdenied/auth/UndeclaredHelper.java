package architecturefixtures.errorsdenied.auth;

import architecturefixtures.errorsdenied.http.ApiErrors;

public class UndeclaredHelper {
    public Object respond() { return ApiErrors.authenticationFailure(); }
}
