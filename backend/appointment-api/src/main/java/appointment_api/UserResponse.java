package appointment_api;

public record UserResponse(String id, String fullName, String email, Role role, String phoneNumber, String specialty, String token) {
    public static UserResponse fromUser(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getPhoneNumber(), user.getSpecialty(), user.getToken());
    }
}
