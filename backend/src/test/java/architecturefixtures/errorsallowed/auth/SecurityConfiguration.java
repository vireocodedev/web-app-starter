package architecturefixtures.errorsallowed.auth;

import architecturefixtures.errorsallowed.http.ApiErrors;
import jakarta.servlet.http.HttpServletResponse;

public class SecurityConfiguration {
    public void respond(ApiErrors errors, HttpServletResponse response) {
        errors.writeAuthenticationRequired(response);
        errors.writeAccessDenied(response, true);
    }
}
