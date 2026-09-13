package appointment_api;

public record DoctorResponse(String id, String fullName, String specialty) {
    public static DoctorResponse fromUser(User user) {
        return new DoctorResponse(user.getId(), user.getFullName(), user.getSpecialty());
    }
}
