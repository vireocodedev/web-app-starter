package architecturefixtures.violations.auth;

import architecturefixtures.violations.user.AppUser;
import architecturefixtures.violations.user.AppUserRepository;
import org.springframework.data.domain.Example;
import org.springframework.data.repository.query.QueryByExampleExecutor;

public class AuthController {
    // An inherited write with an existing parameter: there is no constructor violation to mask it.
    public void write(AppUserRepository users, AppUser existing) {
        users.save(existing);
    }

    public void upcastQuery(AppUserRepository users, AppUser existing) {
        QueryByExampleExecutor<AppUser> queries = users;
        var example = Example.of(existing);
        queries.findAll(example);
        queries.count(example);
        queries.exists(example);
    }

    public void directQuery(QueryByExampleExecutor<AppUser> queries, AppUser existing) {
        var example = Example.of(existing);
        queries.findAll(example);
        queries.count(example);
        queries.exists(example);
    }
}
