package appointment_api;

/** Request body for POST /api/doctor-events. A null/blank time blocks the whole day. */
public record CreateDoctorEventRequest(String doctorId, String date, String time, String title) {}
