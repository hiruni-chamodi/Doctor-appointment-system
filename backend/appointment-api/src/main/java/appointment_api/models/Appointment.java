package appointment_api.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Maps a booked appointment (created via the patient-facing BookingModal) to the
 * "appointments" MongoDB collection.
 */
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;

    // References User.id (role PATIENT) — there is no separate Patient collection.
    private String patientId;
    private String patientName;

    // Doctor identity is stored as plain fields for now since there is no Doctor
    // collection/id to reference yet; revisit once doctors are modeled as entities.
    private String doctorName;
    private String doctorRole;

    private LocalDate date;
    private String timeSlot;

    private AppointmentStatus status;

    private LocalDateTime createdAt;

    public Appointment() {}

    public Appointment(String patientId, String patientName, String doctorName, String doctorRole,
                        LocalDate date, String timeSlot) {
        this.patientId = patientId;
        this.patientName = patientName;
        this.doctorName = doctorName;
        this.doctorRole = doctorRole;
        this.date = date;
        this.timeSlot = timeSlot;
        this.status = AppointmentStatus.CONFIRMED;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorRole() { return doctorRole; }
    public void setDoctorRole(String doctorRole) { this.doctorRole = doctorRole; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
