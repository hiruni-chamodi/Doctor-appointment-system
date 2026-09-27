package appointment_api;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, String status);
    List<Appointment> findByDoctorIdAndDateAndStatusIn(String doctorId, String date, List<String> statuses);
}
