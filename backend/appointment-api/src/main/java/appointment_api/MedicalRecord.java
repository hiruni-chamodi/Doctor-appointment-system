package appointment_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;

    private String patientId;
    private String doctorId;
    private String doctorName;
    private String weight;
    private String bloodPressure;
    private String heartRate;
    private String healthCondition;
    private String medicinesProvided;
    private String additionalNotes;
    private Instant dateRecorded;

    public MedicalRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getBloodPressure() { return bloodPressure; }
    public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }

    public String getHeartRate() { return heartRate; }
    public void setHeartRate(String heartRate) { this.heartRate = heartRate; }

    public String getHealthCondition() { return healthCondition; }
    public void setHealthCondition(String healthCondition) { this.healthCondition = healthCondition; }

    public String getMedicinesProvided() { return medicinesProvided; }
    public void setMedicinesProvided(String medicinesProvided) { this.medicinesProvided = medicinesProvided; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    public Instant getDateRecorded() { return dateRecorded; }
    public void setDateRecorded(Instant dateRecorded) { this.dateRecorded = dateRecorded; }
}
