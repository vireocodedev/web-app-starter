package architecturefixtures.violations.user;

import jakarta.persistence.Entity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RestController;

public class RoleReversals {
    @RestController
    public static class UserController { }

    public static class UserSecurityConfiguration { }

    public static class BadRepository {
        public UserController controller;
        public HttpServletRequest request;
        public UserSecurityConfiguration security;
    }

    @Entity
    public static class BadEntity {
        public UserController controller;
    }
}
