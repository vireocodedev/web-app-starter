package architecturefixtures.errorsdenied.auth;

import architecturefixtures.errorsdenied.http.ApiErrors;
import jakarta.servlet.http.HttpServletResponse;
import java.util.function.Supplier;

public class AuthExceptionHandler {
    public void wrongWriter(ApiErrors errors, HttpServletResponse response) {
        errors.writeAccessDenied(response, false);
    }
    public Supplier<ApiErrors> construct() { return ApiErrors::new; }
    public String readField() { return ApiErrors.INTERNAL; }
}
