package architecturefixtures.errorsallowed.auth;

import architecturefixtures.errorsallowed.http.ApiErrors;
import java.util.Map;
import java.util.function.Supplier;

public class AuthExceptionHandler {
    public Object respond() {
        ApiErrors.validationFailure(Map.of("username", "REQUIRED"));
        ApiErrors.authenticationUnavailable();
        Supplier<Object> authentication = ApiErrors::authenticationFailure;
        return authentication.get();
    }
}
