package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SmsService smsService;

    @PostMapping("/add-patient")
    public ResponseEntity<?> addPatient(@RequestBody AddPatientRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        User authUser = (User) httpRequest.getAttribute("authenticatedUser");
        if (authUser.getRole() != Role.ADMIN && authUser.getRole() != Role.RECEPTIONIST) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Only Admins and Receptionists can add patients."));
        }

        if (request.fullName() == null || request.fullName().isBlank()
                || request.phoneNumber() == null || request.phoneNumber().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Full name and phone number are required."));
        }

        String normalizedName = request.fullName().trim();
        if (userRepository.findByFullName(normalizedName).isPresent()) {
             return ResponseEntity.status(HttpStatus.CONFLICT)
                     .body(new ErrorResponse("A patient with this name already exists."));
        }

        String generatedPassword = UUID.randomUUID().toString().substring(0, 8);
        String passwordHash = passwordEncoder.encode(generatedPassword);

        String dummyEmail = UUID.randomUUID().toString() + "@patient.local";

        User user = new User(normalizedName, dummyEmail, passwordHash, Role.PATIENT, request.phoneNumber().trim(), null);
        User saved = userRepository.save(user);

        String message = "Welcome " + saved.getFullName() + "! Your account has been created. Login with your Name and this Password: " + generatedPassword;
        
        System.out.println("\n=========================================");
        System.out.println("🆕 NEW PATIENT ADDED (Admin)");
        System.out.println("👤 Name: " + saved.getFullName());
        System.out.println("🔑 Password: " + generatedPassword);
        System.out.println("=========================================\n");
        
        try {
            smsService.send(saved.getPhoneNumber(), message);
        } catch (Exception e) {
            System.err.println("⚠️ Could not send SMS: " + e.getMessage());
            System.err.println("Please set NOTIFY_USER_ID, NOTIFY_API_KEY, and NOTIFY_SENDER_ID to enable SMS.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromUser(saved));
    }
}
