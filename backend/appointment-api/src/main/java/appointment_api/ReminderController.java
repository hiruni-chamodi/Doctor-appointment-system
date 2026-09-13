package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reminders")
@CrossOrigin(origins = "http://localhost:4200")
public class ReminderController {

    @Autowired
    private ReminderRepository reminderRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createReminder(@RequestBody CreateReminderRequest request) {
        if (request.doctorId() == null || request.doctorId().isBlank()
                || request.patientId() == null || request.patientId().isBlank()
                || request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("doctorId, patientId and message are required."));
        }

        Optional<User> doctor = userRepository.findById(request.doctorId());
        if (doctor.isEmpty() || doctor.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Doctor not found."));
        }

        Optional<User> patient = userRepository.findById(request.patientId());
        if (patient.isEmpty() || patient.get().getRole() != Role.PATIENT) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Patient not found."));
        }

        Reminder reminder = new Reminder(
                doctor.get().getId(),
                doctor.get().getFullName(),
                patient.get().getId(),
                patient.get().getFullName(),
                request.message(),
                Instant.now()
        );

        Reminder saved = reminderRepository.save(reminder);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/patient/{patientId}")
    public List<Reminder> getRemindersForPatient(@PathVariable String patientId) {
        return reminderRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Reminder> getRemindersForDoctor(@PathVariable String doctorId) {
        return reminderRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        Optional<Reminder> found = reminderRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Reminder not found."));
        }
        Reminder reminder = found.get();
        reminder.setRead(true);
        return ResponseEntity.ok(reminderRepository.save(reminder));
    }
}
