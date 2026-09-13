package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:4200")
public class DoctorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorDayOverrideRepository doctorDayOverrideRepository;

    @GetMapping
    public List<DoctorResponse> getAllDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .map(DoctorResponse::fromUser)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDoctor(@PathVariable String id) {
        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty() || found.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Doctor not found."));
        }
        return ResponseEntity.ok(DoctorResponse.fromUser(found.get()));
    }

    /** Lets a doctor set their standing daily start time and how many patients they'll see per day. */
    @PutMapping("/{id}/settings")
    public ResponseEntity<?> updateSettings(@PathVariable String id, @RequestBody UpdateDoctorSettingsRequest request) {
        if (request.dailyStartTime() == null || request.dailyStartTime().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A daily start time is required."));
        }
        if (request.maxPatientsPerDay() == null || request.maxPatientsPerDay() < 1) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Max patients per day must be at least 1."));
        }

        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty() || found.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Doctor not found."));
        }

        User doctor = found.get();
        doctor.setDailyStartTime(request.dailyStartTime());
        doctor.setMaxPatientsPerDay(request.maxPatientsPerDay());
        User saved = userRepository.save(doctor);
        return ResponseEntity.ok(DoctorResponse.fromUser(saved));
    }

    /** The doctor's start time / patient capacity for one specific date, if they've set one — otherwise 404. */
    @GetMapping("/{id}/day-overrides/{date}")
    public ResponseEntity<?> getDayOverride(@PathVariable String id, @PathVariable String date) {
        return doctorDayOverrideRepository.findByDoctorIdAndDate(id, date)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("No override set for this date.")));
    }

    /** Sets (or replaces) the doctor's start time / patient capacity for one specific date. */
    @PutMapping("/{id}/day-overrides/{date}")
    public ResponseEntity<?> upsertDayOverride(
            @PathVariable String id,
            @PathVariable String date,
            @RequestBody UpsertDayOverrideRequest request
    ) {
        if (request.startTime() == null || request.startTime().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A start time is required."));
        }
        if (request.maxPatients() == null || request.maxPatients() < 1) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Max patients must be at least 1."));
        }

        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty() || found.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Doctor not found."));
        }

        DoctorDayOverride override = doctorDayOverrideRepository.findByDoctorIdAndDate(id, date)
                .orElseGet(() -> new DoctorDayOverride(id, date, null, null));
        override.setStartTime(request.startTime());
        override.setMaxPatients(request.maxPatients());

        DoctorDayOverride saved = doctorDayOverrideRepository.save(override);
        return ResponseEntity.ok(saved);
    }

    /** Removes a date's override, reverting it to the doctor's standing default. */
    @DeleteMapping("/{id}/day-overrides/{date}")
    public ResponseEntity<?> deleteDayOverride(@PathVariable String id, @PathVariable String date) {
        doctorDayOverrideRepository.findByDoctorIdAndDate(id, date)
                .ifPresent(override -> doctorDayOverrideRepository.deleteById(override.getId()));
        return ResponseEntity.noContent().build();
    }
}
