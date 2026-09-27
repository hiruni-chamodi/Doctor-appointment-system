package appointment_api;

public record CreateReminderRequest(String doctorId, String patientId, String message) {}
