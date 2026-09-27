package appointment_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorDayOverrideRepository extends MongoRepository<DoctorDayOverride, String> {
    Optional<DoctorDayOverride> findByDoctorIdAndDate(String doctorId, String date);
}
