package appointment_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A doctor's start time / patient capacity for one specific date, overriding their standing
 * default (User.dailyStartTime / User.maxPatientsPerDay) for just that day.
 */
@Document(collection = "doctor_day_overrides")
public class DoctorDayOverride {

    @Id
    private String id;

    private String doctorId;
    private String date; // ISO yyyy-MM-dd
    private String startTime;
    private Integer maxPatients;

    public DoctorDayOverride() {}

    public DoctorDayOverride(String doctorId, String date, String startTime, Integer maxPatients) {
        this.doctorId = doctorId;
        this.date = date;
        this.startTime = startTime;
        this.maxPatients = maxPatients;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public Integer getMaxPatients() { return maxPatients; }
    public void setMaxPatients(Integer maxPatients) { this.maxPatients = maxPatients; }
}
