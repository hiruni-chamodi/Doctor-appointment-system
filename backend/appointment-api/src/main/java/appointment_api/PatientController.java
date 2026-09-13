package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    // PLACEHOLDER data pools until a real MedicalRecord model exists — see PatientRecordResponse.
    private static final List<String> BLOOD_TYPES =
            List.of("O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-");

    private static final List<List<String>> ALLERGY_SETS = List.of(
            List.of("None known"),
            List.of("Penicillin"),
            List.of("Peanuts", "Shellfish"),
            List.of("Latex"),
            List.of("Pollen", "Dust")
    );

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<PatientRecordResponse> getAllPatients() {
        return userRepository.findByRole(Role.PATIENT).stream()
                .map(this::toPatientRecord)
                .toList();
    }

    /**
     * bloodType, allergies, and lastVisitDate are PLACEHOLDER values derived from the
     * patient's id, purely so the record browser has varied data to display. There is no
     * real medical record data behind them yet.
     */
    private PatientRecordResponse toPatientRecord(User user) {
        int seed = Math.abs(user.getId().hashCode());
        String bloodType = BLOOD_TYPES.get(seed % BLOOD_TYPES.size());
        List<String> allergies = ALLERGY_SETS.get(seed % ALLERGY_SETS.size());
        String lastVisitDate = LocalDate.now().minusDays(seed % 180).toString();

        return new PatientRecordResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                bloodType,
                allergies,
                lastVisitDate
        );
    }
}
