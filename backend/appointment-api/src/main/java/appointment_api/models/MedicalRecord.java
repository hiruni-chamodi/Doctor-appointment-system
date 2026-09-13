package appointment_api.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;
    private String patientId;
    private String doctorId;
    private String appointmentId; // Links this record directly to the specific booking
    private String healthCondition; 
    private String medicinesProvided; 
    private String additionalNotes;
    private LocalDateTime dateRecorded;

    public MedicalRecord() {}

    public MedicalRecord(String patientId, String doctorId, String appointmentId, String healthCondition, String medicinesProvided, String additionalNotes) {
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.healthCondition = healthCondition;
        this.medicinesProvided = medicinesProvided;
        this.additionalNotes = additionalNotes;
        this.dateRecorded = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getHealthCondition() { return healthCondition; }
    public void setHealthCondition(String healthCondition) { this.healthCondition = healthCondition; }

    public String getMedicinesProvided() { return medicinesProvided; }
    public void setMedicinesProvided(String medicinesProvided) { this.medicinesProvided = medicinesProvided; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    public LocalDateTime getDateRecorded() { return dateRecorded; }
    public void setDateRecorded(LocalDateTime dateRecorded) { this.dateRecorded = dateRecorded; }
}