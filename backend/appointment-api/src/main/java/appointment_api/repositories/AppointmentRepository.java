package appointment_api.repositories;

import appointment_api.models.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByPatientId(String patientId);
    // We can add findByDoctorName later when the Doctor entity is finalized
}
