package appointment_api;

public record RegisterRequest(String fullName, String email, String password, Role role, String specialty) {}
