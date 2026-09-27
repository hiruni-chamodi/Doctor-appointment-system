package appointment_api;

public record NotifyPatientRequest(String appointmentId, String message) {}