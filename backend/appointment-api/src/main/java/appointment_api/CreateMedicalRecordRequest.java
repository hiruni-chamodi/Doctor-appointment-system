package appointment_api;

/**
 * Request body for POST /api/medical-records — a doctor recording a patient's visit.
 */
public record CreateMedicalRecordRequest(
        String patientId,
        String doctorId,
        String doctorName,
        String healthCondition,
        String medicinesProvided,
        String additionalNotes
) {}
