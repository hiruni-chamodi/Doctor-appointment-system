package appointment_api;

public record DoctorResponse(
        String id,
        String fullName,
        String specialty,
        String dailyStartTime,
        Integer maxPatientsPerDay,
        String profilePictureBase64
) {
    public static DoctorResponse fromUser(User user) {
        return new DoctorResponse(
                user.getId(),
                user.getFullName(),
                user.getSpecialty(),
                user.getDailyStartTime(),
                user.getMaxPatientsPerDay(),
                user.getProfilePictureBase64()
        );
    }
}
