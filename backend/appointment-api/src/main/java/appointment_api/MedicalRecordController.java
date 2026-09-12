package appointment_api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "http://localhost:4200")
public class MedicalRecordController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/patient/{patientId}")
    public List<MedicalRecord> getPatientRecords(@PathVariable String patientId) {
        return medicalRecordRepository.findByPatientIdOrderByDateRecordedDesc(patientId);
    }

    @PostMapping
    public ResponseEntity<?> createRecord(@RequestBody CreateMedicalRecordRequest request) {
        if (request.patientId() == null || request.patientId().isBlank()
                || request.healthCondition() == null || request.healthCondition().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Patient and health condition are required."));
        }

        // Only an account that actually holds the DOCTOR or ADMIN role may write a record —
        // this is what stops a patient (who only ever appears as patientId, never doctorId)
        // from adding or editing their own medical record.
        if (request.doctorId() == null || request.doctorId().isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only a doctor can add a medical record."));
        }
        boolean isDoctorOrAdmin = userRepository.findById(request.doctorId())
                .map(user -> user.getRole() == Role.DOCTOR || user.getRole() == Role.ADMIN)
                .orElse(false);
        if (!isDoctorOrAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Only a doctor can add a medical record."));
        }

        MedicalRecord record = new MedicalRecord();
        record.setPatientId(request.patientId());
        record.setDoctorId(request.doctorId());
        record.setDoctorName(request.doctorName());
        record.setHealthCondition(request.healthCondition().trim());
        record.setMedicinesProvided(blankToNull(request.medicinesProvided()));
        record.setAdditionalNotes(blankToNull(request.additionalNotes()));
        record.setDateRecorded(Instant.now());

        MedicalRecord saved = medicalRecordRepository.save(record);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
