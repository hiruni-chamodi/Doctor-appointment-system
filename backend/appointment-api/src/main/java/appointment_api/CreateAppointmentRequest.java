package appointment_api;

public record CreateAppointmentRequest(String patientId, String doctorId, String date, String time) {}
