package appointment_api;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private Role role;

    private String specialty;

    public User() {}

    public User(String fullName, String email, String passwordHash, Role role, String specialty) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.specialty = specialty;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
}
