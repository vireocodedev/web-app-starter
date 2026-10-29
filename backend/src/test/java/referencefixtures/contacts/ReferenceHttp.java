package referencefixtures.contacts;

import java.security.Principal;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.function.Supplier;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Translation runs outside the service proxy, so flush AND commit failures have finished rollback. */
final class ReferenceHttp {
    private ReferenceHttp() {
    }

    static String actor(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return principal.getName();
    }

    static long version(String raw) {
        if (raw == null || !raw.matches("[0-9]+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
    }

    static <T> T input(Supplier<T> action) {
        try {
            return action.get();
        } catch (IllegalArgumentException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
    }

    static <T> T uniqueContactWrite(Supplier<T> action) {
        try {
            return action.get();
        } catch (RuntimeException failure) {
            var seen = Collections.newSetFromMap(new IdentityHashMap<Throwable, Boolean>());
            for (Throwable cause = failure; cause != null && seen.add(cause); cause = cause.getCause()) {
                if (cause instanceof ConstraintViolationException constraint
                && "template_reference_contact_group_code_uk".equals(constraint.getConstraintName())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT);
                }
            }

            throw failure;
        }
    }
}
