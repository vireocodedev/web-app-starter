package com.vireocode.backend;

import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		boolean provisioning = provisioningRequested(args);
		var application = new SpringApplication(BackendApplication.class);
		if (provisioning) {
			application.setAdditionalProfiles("provision-user");
		}
		var context = application.run(args);
		if (provisioning) {
			context.close();
		}
	}

	static boolean provisioningRequested(String[] args) {
		var arguments = new DefaultApplicationArguments(args);
		if (!arguments.containsOption("provision-user")) {
			return false;
		}
		if (!arguments.getOptionValues("provision-user").isEmpty()) {
			throw new IllegalArgumentException("--provision-user is a flag without a value.");
		}
		return true;
	}

}
