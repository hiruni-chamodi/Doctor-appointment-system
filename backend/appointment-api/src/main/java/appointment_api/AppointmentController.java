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

    // Fallback capacity for a doctor who hasn't configured a daily patient limit yet —
    // matches the number of fixed bookable time slots in a day.
    private static final int DEFAULT_MAX_PATIENTS_PER_DAY = 8;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorEventRepository doctorEventRepository;

    @Autowired
    private DoctorDayOverrideRepository doctorDayOverrideRepository;

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody CreateAppointmentRequest request) {
        if (request.patientId() == null || request.patientId().isBlank()
                || request.doctorId() == null || request.doctorId().isBlank()
                || request.date() == null || request.date().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("patientId, doctorId and date are required."));
        }

        Optional<User> patient = userRepository.findById(request.patientId());
        if (patient.isEmpty() || patient.get().getRole() != Role.PATIENT) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Patient not found."));
        }

        Optional<User> doctorLookup = userRepository.findById(request.doctorId());
        if (doctorLookup.isEmpty() || doctorLookup.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Doctor not found."));
        }
        User doctor = doctorLookup.get();

        if (isBlockedAllDay(request.doctorId(), request.date())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This doctor is unavailable on the selected date."));
        }

        long bookedCount = appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(request.doctorId(), request.date(), SLOT_HOLDING_STATUSES)
                .size();
        if (bookedCount >= resolveMaxPatients(doctor, request.date())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This doctor is fully booked for the selected date. Please choose another date."));
        }

        // A specific time is optional now — patients request a doctor/date and an admin
        // assigns the actual time (see /schedule below). If one is supplied anyway, still
        // guard against double-booking it.
        String time = (request.time() == null || request.time().isBlank()) ? null : request.time();
        if (time != null && isTimeBlocked(request.doctorId(), request.date(), time)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This time slot is not available. Please choose another time."));
        }
        if (time != null) {
            boolean slotTaken = appointmentRepository
                    .findByDoctorIdAndDateAndStatusIn(request.doctorId(), request.date(), SLOT_HOLDING_STATUSES)
                    .stream()
                    .anyMatch(existing -> time.equals(existing.getTime()));
            if (slotTaken) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("This time slot is no longer available. Please choose another time."));
            }
        }

        Appointment appointment = new Appointment(
                patient.get().getId(),
                patient.get().getFullName(),
                doctor.getId(),
                doctor.getFullName(),
                doctor.getSpecialty(),
                request.date(),
                time,
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

    @GetMapping("/all")
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
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

    /** Times already held (pending or confirmed) for a doctor on a given date, so a scheduling UI can grey them out. */
    @GetMapping("/doctor/{doctorId}/unavailable-times")
    public List<String> getUnavailableTimes(@PathVariable String doctorId, @RequestParam String date) {
        return appointmentRepository.findByDoctorIdAndDateAndStatusIn(doctorId, date, SLOT_HOLDING_STATUSES)
                .stream()
                .filter(appointment -> appointment.getTime() != null)
                .map(appointment -> appointment.getTime())
                .toList();
    }

    /** Whether a doctor still has room on a given date — drives the patient booking flow and the admin scheduling screen. */
    @GetMapping("/doctor/{doctorId}/day-summary")
    public ResponseEntity<?> getDaySummary(@PathVariable String doctorId, @RequestParam String date) {
        Optional<User> doctorLookup = userRepository.findById(doctorId);
        if (doctorLookup.isEmpty() || doctorLookup.get().getRole() != Role.DOCTOR) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Doctor not found."));
        }
        User doctor = doctorLookup.get();

        int max = resolveMaxPatients(doctor, date);
        int booked = appointmentRepository.findByDoctorIdAndDateAndStatusIn(doctorId, date, SLOT_HOLDING_STATUSES).size();
        boolean blockedAllDay = isBlockedAllDay(doctorId, date);

        return ResponseEntity.ok(new DoctorDaySummaryResponse(
                max,
                booked,
                Math.max(0, max - booked),
                blockedAllDay,
                resolveStartTime(doctor, date)
        ));
    }

    /** Admin assigns the actual time to a pending request that was made without one. */
    @PatchMapping("/{id}/schedule")
    public ResponseEntity<?> scheduleAppointment(@PathVariable String id, @RequestBody ScheduleAppointmentRequest request) {
        if (request.time() == null || request.time().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A time is required."));
        }

        Optional<Appointment> found = appointmentRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Appointment not found."));
        }

        Appointment appointment = found.get();
        if (!"PENDING".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Only pending appointments can be scheduled."));
        }

        String time = request.time();
        if (isTimeBlocked(appointment.getDoctorId(), appointment.getDate(), time)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("The doctor is unavailable at this time."));
        }

        boolean slotTaken = appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(appointment.getDoctorId(), appointment.getDate(), List.of("CONFIRMED"))
                .stream()
                .anyMatch(existing -> time.equals(existing.getTime()) && !existing.getId().equals(appointment.getId()));
        if (slotTaken) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("This time slot was already confirmed for another patient."));
        }

        appointment.setTime(time);
        appointment.setStatus("CONFIRMED");
        appointment.setRejectionReason(null);
        Appointment saved = appointmentRepository.save(appointment);

        // Any other pending request for the same doctor/date/time is now moot — auto-decline it
        // so it doesn't sit in the queue implying the slot is still open.
        appointmentRepository
                .findByDoctorIdAndDateAndStatusIn(appointment.getDoctorId(), appointment.getDate(), List.of("PENDING"))
                .stream()
                .filter(other -> time.equals(other.getTime()) && !other.getId().equals(appointment.getId()))
                .forEach(other -> {
                    other.setStatus("REJECTED");
                    other.setRejectionReason("This time slot was booked by another patient.");
                    appointmentRepository.save(other);
                });

        return ResponseEntity.ok(saved);
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
        if (appointment.getTime() == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("This request has no time yet — use schedule to assign one first."));
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
                .filter(other -> appointment.getTime().equals(other.getTime()) && !other.getId().equals(appointment.getId()))
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

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {
        String normalizedStatus = status.toUpperCase();
        if (!List.of("CANCELED", "CONFIRMED", "REJECTED").contains(normalizedStatus)) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Status must be CANCELED, CONFIRMED, or REJECTED."));
        }

        Optional<Appointment> found = appointmentRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("Appointment not found."));
        }

        Appointment appointment = found.get();
        if ("CANCELED".equals(normalizedStatus)
                && !"PENDING".equals(appointment.getStatus())
                && !"CONFIRMED".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Only pending or confirmed appointments can be canceled."));
        }
        if (!"CANCELED".equals(normalizedStatus) && !"PENDING".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Only pending appointments can be accepted or rejected."));
        }

        if ("CONFIRMED".equals(normalizedStatus)) {
            if (appointment.getTime() == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("This request has no time yet — use schedule to assign one first."));
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
        }

        appointment.setStatus(normalizedStatus);
        appointment.setRejectionReason("REJECTED".equals(normalizedStatus) ? "Declined by receptionist." : null);
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    /** A per-date override (see DoctorDayOverride) wins over the doctor's standing settings, which win over the fallback default. */
    private int resolveMaxPatients(User doctor, String date) {
        Optional<DoctorDayOverride> override = doctorDayOverrideRepository.findByDoctorIdAndDate(doctor.getId(), date);
        if (override.isPresent() && override.get().getMaxPatients() != null) {
            return override.get().getMaxPatients();
        }
        return doctor.getMaxPatientsPerDay() != null ? doctor.getMaxPatientsPerDay() : DEFAULT_MAX_PATIENTS_PER_DAY;
    }

    private String resolveStartTime(User doctor, String date) {
        Optional<DoctorDayOverride> override = doctorDayOverrideRepository.findByDoctorIdAndDate(doctor.getId(), date);
        if (override.isPresent() && override.get().getStartTime() != null) {
            return override.get().getStartTime();
        }
        return doctor.getDailyStartTime();
    }

    private boolean isBlockedAllDay(String doctorId, String date) {
        return doctorEventRepository.findByDoctorIdAndDate(doctorId, date).stream()
                .anyMatch(event -> event.getTime() == null);
    }

    private boolean isTimeBlocked(String doctorId, String date, String time) {
        return doctorEventRepository.findByDoctorIdAndDate(doctorId, date).stream()
                .anyMatch(event -> event.getTime() == null || event.getTime().equals(time));
    }
}
