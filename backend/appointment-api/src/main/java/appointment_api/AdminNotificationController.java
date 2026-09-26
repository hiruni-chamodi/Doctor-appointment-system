package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminNotificationController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SmsService smsService;

    @PostMapping("/notify-patient")
    public ResponseEntity<?> notifyPatient(@RequestBody NotifyPatientRequest request) {
        if (request.appointmentId() == null || request.appointmentId().isBlank()
                || request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("appointmentId and message are required."));
        }

        Appointment appointment = appointmentRepository.findById(request.appointmentId()).orElse(null);
        if (appointment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Appointment not found."));
        }
        if (!"CONFIRMED".equals(appointment.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("A patient can only be notified about a confirmed appointment."));
        }

        User patient = userRepository.findById(appointment.getPatientId()).orElse(null);
        if (patient == null || patient.getRole() != Role.PATIENT) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Patient not found."));
        }
        if (patient.getPhoneNumber() == null || patient.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("This patient does not have a phone number."));
        }

        try {
            smsService.send(patient.getPhoneNumber(), request.message().trim());
            return ResponseEntity.ok(new ErrorResponse("SMS sent successfully."));
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("The SMS could not be sent. Check the Notify.lk configuration and phone number."));
        }
    }
}