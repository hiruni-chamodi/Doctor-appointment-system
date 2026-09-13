package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:4200")
public class DoctorController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<DoctorResponse> getAllDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .map(DoctorResponse::fromUser)
                .toList();
    }
}
