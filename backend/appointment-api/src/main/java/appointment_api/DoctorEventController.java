package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/doctor-events")
@CrossOrigin(origins = "http://localhost:4200")
public class DoctorEventController {

    @Autowired
    private DoctorEventRepository doctorEventRepository;

    @GetMapping("/doctor/{doctorId}")
    public List<DoctorEvent> getForDoctor(@PathVariable String doctorId) {
        return doctorEventRepository.findByDoctorIdOrderByDateAsc(doctorId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDoctorEventRequest request) {
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
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (doctorEventRepository.existsById(id)) {
            doctorEventRepository.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }
}
