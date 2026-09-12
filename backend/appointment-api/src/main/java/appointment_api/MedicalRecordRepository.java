package appointment_api;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {
    List<MedicalRecord> findByPatientIdOrderByDateRecordedDesc(String patientId);
}
