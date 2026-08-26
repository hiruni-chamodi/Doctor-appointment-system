package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {
        try {
            System.out.println("Attempting to save patient: " + patient.getName());
            return patientRepository.save(patient);
        } catch (Exception e) {
            System.err.println("--- CRITICAL ERROR SAVING TO MONGODB ---");
            e.printStackTrace();
            throw e; // Rethrow to let Angular know it failed
        }
    }
    }
