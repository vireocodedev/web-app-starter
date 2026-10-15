package com.vireocode.backend;

import com.vireocode.backend.user.AppUserRepository;
import com.vireocode.backend.user.LocalUserInitializer;
import com.vireocode.backend.user.ProvisionUserRunner;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
		"PROVISION_USER_USERNAME=ignored-operator",
		"PROVISION_USER_PASSWORD=ignored-fixture-password",
		"PROVISION_USER_EMAIL=ignored@example.com",
		"PROVISION_USER_DISPLAY_NAME=Ignored Operator"
})
class BackendApplicationTests {

	@Autowired
	ApplicationContext context;

	@Autowired
	AppUserRepository users;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	Environment environment;

	@Test
	void migrationsOwnTheSchemaAndNonLocalStartupDoesNotCreateAUser() {
		assertThat(users.count()).isZero();
		assertThat(context.getBeansOfType(LocalUserInitializer.class)).isEmpty();
		assertThat(context.getBeansOfType(ProvisionUserRunner.class)).isEmpty();
		assertThat(environment.getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
		assertThat(jdbc.queryForObject(
				"select count(*) from flyway_schema_history where success = true", Integer.class)).isEqualTo(2);
		assertThat(jdbc.queryForObject("select count(*) from spring_session", Integer.class)).isZero();
	}

}
