package appointment_api;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * We only depend on spring-security-crypto (for BCryptPasswordEncoder), not the full
 * spring-boot-starter-security, so there is no auto-configured PasswordEncoder bean.
 * This class provides the one bean we need for password hashing.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
