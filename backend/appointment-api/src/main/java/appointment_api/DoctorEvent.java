package appointment_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A doctor-blocked slot on their calendar — leave, a meeting, a conference, etc.
 * A null {@code time} blocks the whole day; a specific time blocks just that bookable slot.
 */
@Document(collection = "doctor_events")
public class DoctorEvent {

    @Id
    private String id;

    private String doctorId;
    private String date; // ISO yyyy-MM-dd
    private String time; // one of BOOKABLE_TIME_SLOTS, or null to block the entire day
    private String title;
    private Instant createdAt;

    public DoctorEvent() {}

    public DoctorEvent(String doctorId, String date, String time, String title, Instant createdAt) {
        this.doctorId = doctorId;
        this.date = date;
        this.time = time;
        this.title = title;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
