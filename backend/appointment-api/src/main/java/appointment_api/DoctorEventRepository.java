package appointment_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorEventRepository extends MongoRepository<DoctorEvent, String> {
    List<DoctorEvent> findByDoctorIdOrderByDateAsc(String doctorId);
    List<DoctorEvent> findByDoctorIdAndDate(String doctorId, String date);
}
