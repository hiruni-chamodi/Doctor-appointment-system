package appointment_api;

/** Request body for PUT /api/doctors/{id}/settings — a doctor's standing daily start time and patient capacity. */
public record UpdateDoctorSettingsRequest(String dailyStartTime, Integer maxPatientsPerDay) {}
