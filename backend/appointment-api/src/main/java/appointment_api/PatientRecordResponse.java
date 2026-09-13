package appointment_api;

import java.util.List;

/**
 * Response for GET /api/patients (the doctor-facing patient record browser).
 *
 * id / fullName / email come from the real User document. bloodType, allergies, and
 * lastVisitDate are PLACEHOLDER values only — there is no real MedicalRecord schema yet,
 * so PatientController derives them deterministically from the patient's id just so the
 * UI has something to render. Replace this once an actual medical record model exists.
 */
public record PatientRecordResponse(
        String id,
        String fullName,
        String email,
        String bloodType,
        List<String> allergies,
        String lastVisitDate
) {}
