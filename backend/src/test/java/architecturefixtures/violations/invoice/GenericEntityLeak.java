package architecturefixtures.violations.invoice;

import architecturefixtures.violations.user.AppUser;
import java.util.List;

public class GenericEntityLeak {
    // AppUser occurs only in the generic signature, never in an instruction or raw return type.
    public List<AppUser> leakedUsers() { return List.of(); }
}
