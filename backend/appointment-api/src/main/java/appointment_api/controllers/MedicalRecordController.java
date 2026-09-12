package appointment_api.controllers;

import appointment_api.models.MedicalRecord;
import appointment_api.repositories.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "http://localhost:4200")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @PostMapping
    public ResponseEntity<MedicalRecord> createMedicalRecord(@RequestBody MedicalRecord record) {
        // Ensure the timestamp is always set on the server side
        record.setDateRecorded(LocalDateTime.now());
        
        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        return new ResponseEntity<>(savedRecord, HttpStatus.CREATED);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(@PathVariable String patientId) {
        List<MedicalRecord> records = medicalRecordRepository.findByPatientId(patientId);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<MedicalRecord>> getRecordByAppointment(@PathVariable String appointmentId) {
        List<MedicalRecord> records = medicalRecordRepository.findByAppointmentId(appointmentId);
        return ResponseEntity.ok(records);
    }
}