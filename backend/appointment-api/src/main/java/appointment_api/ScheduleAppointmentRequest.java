package appointment_api;

/** Request body for PATCH /api/appointments/{id}/schedule — an admin assigning the actual time to a pending request. */
public record ScheduleAppointmentRequest(String time) {}
