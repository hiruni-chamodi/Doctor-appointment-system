package appointment_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends MongoRepository<Patient, String> {
    // Spring Boot automatically gives us save(), findAll(), findById(), etc.
}