package architecturefixtures.errorsdenied.auth;

import architecturefixtures.errorsdenied.http.ApiErrors;
import architecturefixtures.errorsdenied.http.ApiExceptionHandler;

public class SecurityConfiguration {
    public ApiExceptionHandler internalAdvice;
    public Object wrongFactory() { return ApiErrors.authenticationFailure(); }
}
