package referencefixtures.contacts;

import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/** Service-side bounds also protect direct callers; transport translates invalid arguments. */
final class ReferenceInput {
    private ReferenceInput() {
    }

    static String actor(String actor) {
        if (actor == null || actor.isBlank() || actor.length() > 100) {
            throw new IllegalArgumentException("Invalid reference actor");
        }

        return actor;
    }

    static PageRequest page(int page, int size, String sort, String direction, Set<String> allowed) {
        if (page < 0 || size < 1 || size > 100 || !allowed.contains(sort)
        || !("asc".equals(direction) || "desc".equals(direction))) {
            throw new IllegalArgumentException("Invalid reference page");
        }

        return PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sort)
        .and(Sort.by("id")));
    }

    static String search(String search) {
        if (search == null || search.length() > 100) throw new IllegalArgumentException("Invalid search");
        return search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
