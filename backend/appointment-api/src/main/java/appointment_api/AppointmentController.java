package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:4200")
public class AppointmentController {

    // Appointments booked or awaiting a decision both hold their slot, so neither
    // status can be double-booked by another patient.
    private static final List<String> SLOT_HOLDING_STATUSES = List.of("PENDING", "CONFIRMED");

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody CreateAppointmentRequest request) {
        if (request.patientId() == null || request.patientId().isBlank()
                || request.doctorId() == null || request.doctorId().isBlank()
                || request.date() == null || request.date().isBlank()
                || request.time() == null || request.time().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("patientId, doctorId, date and time are required."));
        }

        Optional<User> patient = userRepository.findById(request.patientId());
        if (patient.isEmpty() || patient.get().getRole() != Role.PATIENT) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Patient not found."));
        }

        Optional<User> doctor = userRepository.findById(request.doctorId());
        if (doctor.isEmpty() || doctor.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Doctor not found."));
        }

        boolean slotTaken = appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(request.doctorId(), request.date(), SLOT_HOLDING_STATUSES)
                .stream()
                .anyMatch(existing -> existing.getTime().equals(request.time()));
        if (slotTaken) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This time slot is no longer available. Please choose another time."));
        }

        Appointment appointment = new Appointment(
                patient.get().getId(),
                patient.get().getFullName(),
                doctor.get().getId(),
                doctor.get().getFullName(),
                doctor.get().getSpecialty(),
                request.date(),
                request.time(),
                "PENDING",
                Instant.now()
        );

        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsForPatient(@PathVariable String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getAppointmentsForDoctor(
            @PathVariable String doctorId,
            @RequestParam(required = false) String status
    ) {
        if (status != null && !status.isBlank()) {
            return appointmentRepository.findByDoctorIdAndStatus(doctorId, status.toUpperCase());
        }
        return appointmentRepository.findByDoctorId(doctorId);
    }

    /** Times already held (pending or confirmed) for a doctor on a given date, so the booking UI can grey them out. */
    @GetMapping("/doctor/{doctorId}/unavailable-times")
    public List<String> getUnavailableTimes(@PathVariable String doctorId, @RequestParam String date) {
        return appointmentRepository.findByDoctorIdAndDateAndStatusIn(doctorId, date, SLOT_HOLDING_STATUSES)
                .stream()
                .map(Appointment::getTime)
                .toList();
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<?> acceptAppointment(@PathVariable String id) {
        Optional<Appointment> found = appointmentRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Appointment not found."));
        }

        Appointment appointment = found.get();
        if (!"PENDING".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Only pending appointments can be accepted."));
        }

        boolean alreadyConfirmed = appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(appointment.getDoctorId(), appointment.getDate(), List.of("CONFIRMED"))
                .stream()
                .anyMatch(existing -> existing.getTime().equals(appointment.getTime())
                        && !existing.getId().equals(appointment.getId()));
        if (alreadyConfirmed) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This time slot was already confirmed for another patient."));
        }

        appointment.setStatus("CONFIRMED");
        appointment.setRejectionReason(null);
        Appointment saved = appointmentRepository.save(appointment);

        // Any other pending request for the same doctor/date/time is now moot — auto-decline it
        // so it doesn't sit in the doctor's queue implying the slot is still open.
        appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(appointment.getDoctorId(), appointment.getDate(), List.of("PENDING"))
                .stream()
                .filter(other -> other.getTime().equals(appointment.getTime()) && !other.getId().equals(appointment.getId()))
                .forEach(other -> {
                    other.setStatus("REJECTED");
                    other.setRejectionReason("This time slot was booked by another patient.");
                    appointmentRepository.save(other);
                });

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectAppointment(@PathVariable String id, @RequestBody RejectAppointmentRequest request) {
        if (request.reason() == null || request.reason().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A reason is required to reject an appointment."));
        }

        Optional<Appointment> found = appointmentRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Appointment not found."));
        }

        Appointment appointment = found.get();
        if (!"PENDING".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Only pending appointments can be rejected."));
        }

        appointment.setStatus("REJECTED");
        appointment.setRejectionReason(request.reason());
        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.ok(saved);
    }
}
