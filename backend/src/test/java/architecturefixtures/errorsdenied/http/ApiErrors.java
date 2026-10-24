package architecturefixtures.errorsdenied.http;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

public class ApiErrors {
    public static String INTERNAL = "internal";
    public void writeAuthenticationRequired(HttpServletResponse response) { }
    public void writeAccessDenied(HttpServletResponse response, boolean csrfInvalid) { }
    public static Object authenticationFailure() { return null; }
    public static Object validationFailure(Map<String, String> fields) { return null; }
}
