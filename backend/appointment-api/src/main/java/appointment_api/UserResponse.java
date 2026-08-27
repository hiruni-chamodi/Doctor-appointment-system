package appointment_api;

public record UserResponse(String id, String fullName, String email, Role role, String specialty) {
    public static UserResponse fromUser(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getSpecialty());
    }
}
