package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<PatientRecordResponse> getAllPatients(jakarta.servlet.http.HttpServletRequest request) {
        User authUser = (User) request.getAttribute("authenticatedUser");
        if (authUser != null && authUser.getRole() == Role.PATIENT) {
            return List.of(toPatientRecord(authUser));
        }
        return userRepository.findByRole(Role.PATIENT).stream()
                .map(this::toPatientRecord)
                .toList();
    }

    private PatientRecordResponse toPatientRecord(User user) {
        return new PatientRecordResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                null, // bloodType no longer generated here
                null, // allergies no longer generated here
                null  // lastVisitDate no longer generated here
        );
    }
}
