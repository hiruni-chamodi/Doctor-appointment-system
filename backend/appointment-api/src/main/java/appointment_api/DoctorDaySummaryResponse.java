package appointment_api;

/** Tells the patient booking flow (and admin scheduling screen) whether a doctor still has room on a given date. */
public record DoctorDaySummaryResponse(
        int maxPatientsPerDay,
        int bookedCount,
        int remaining,
        boolean blockedAllDay,
        String dailyStartTime
) {}
