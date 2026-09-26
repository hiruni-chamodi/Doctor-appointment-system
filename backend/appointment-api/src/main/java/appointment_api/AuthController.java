package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.fullName() == null || request.fullName().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()
                || request.role() == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Full name, email, password and role are required."));
        }

            if (request.role() == Role.PATIENT && (request.phoneNumber() == null || request.phoneNumber().isBlank())) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("A phone number is required for patient accounts."));
            }

        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("An account with this email already exists."));
        }

        String passwordHash = passwordEncoder.encode(request.password());
        User user = new User(request.fullName().trim(), normalizedEmail, passwordHash, request.role(),
            blankToNull(request.phoneNumber()), request.specialty());
        User saved = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromUser(saved));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password."));
        }

        String normalizedEmail = request.email().trim().toLowerCase();

        return userRepository.findByEmail(normalizedEmail)
                .filter(user -> passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserResponse.fromUser(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid email or password.")));
    }
}
