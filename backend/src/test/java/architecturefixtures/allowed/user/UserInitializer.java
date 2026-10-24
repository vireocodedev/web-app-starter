package architecturefixtures.allowed.user;

import org.springframework.security.crypto.password.PasswordEncoder;

public class UserInitializer {
    public String encode(PasswordEncoder encoder) {
        return encoder.encode("fixture");
    }
}
