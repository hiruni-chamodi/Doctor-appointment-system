package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/doctor-events")
@CrossOrigin(origins = "http://localhost:4200")
public class DoctorEventController {

    @Autowired
    private DoctorEventRepository doctorEventRepository;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getForDoctor(@PathVariable String doctorId, jakarta.servlet.http.HttpServletRequest httpRequest) {
        User authUser = (User) httpRequest.getAttribute("authenticatedUser");
        if (authUser == null || (authUser.getRole() == Role.PATIENT)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Not authorized to view doctor events."));
        }
        return ResponseEntity.ok(doctorEventRepository.findByDoctorIdOrderByDateAsc(doctorId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDoctorEventRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        User authUser = (User) httpRequest.getAttribute("authenticatedUser");
        if (authUser == null || authUser.getRole() == Role.PATIENT || (authUser.getRole() == Role.DOCTOR && !authUser.getId().equals(request.doctorId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Not authorized to create an event for this doctor."));
        }

        if (request.doctorId() == null || request.doctorId().isBlank()
                || request.date() == null || request.date().isBlank()
                || request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("doctorId, date and title are required."));
        }

        String time = (request.time() == null || request.time().isBlank()) ? null : request.time();
        DoctorEvent event = new DoctorEvent(request.doctorId(), request.date(), time, request.title().trim(), Instant.now());
        DoctorEvent saved = doctorEventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        java.util.Optional<DoctorEvent> event = doctorEventRepository.findById(id);
        if (event.isPresent()) {
            User authUser = (User) httpRequest.getAttribute("authenticatedUser");
            if (authUser == null || authUser.getRole() == Role.PATIENT || (authUser.getRole() == Role.DOCTOR && !authUser.getId().equals(event.get().getDoctorId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Not authorized to delete this event."));
            }
            doctorEventRepository.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }
}
