package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "http://localhost:4200")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @GetMapping("/patient/{patientId}")
    public List<MedicalRecord> getPatientRecords(@PathVariable String patientId) {
        return medicalRecordRepository.findByPatientIdOrderByDateRecordedDesc(patientId);
    }
}
