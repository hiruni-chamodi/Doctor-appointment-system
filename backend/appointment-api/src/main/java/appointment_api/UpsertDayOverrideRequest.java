package appointment_api;

/** Request body for PUT /api/doctors/{id}/day-overrides/{date}. */
public record UpsertDayOverrideRequest(String startTime, Integer maxPatients) {}
