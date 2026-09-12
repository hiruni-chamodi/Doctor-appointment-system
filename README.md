# Zenith Medical — Doctor Appointment System

A full-stack doctor appointment platform with role-based dashboards for **patients** and **doctors**, built with **Angular** on the frontend and **Spring Boot + MongoDB Atlas** on the backend.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Angular 21 (standalone components), TypeScript, Tailwind CSS (CDN) |
| Backend  | Spring Boot 4.1.1, Java 17, Spring Security (password hashing) |
| Database | MongoDB Atlas (via `spring-boot-starter-data-mongodb`) |
| Build    | Maven (backend), npm/Angular CLI (frontend) |

## Project Structure

```
doctor-appointment-system/
├── backend/appointment-api/     # Spring Boot REST API
│   └── src/main/java/appointment_api/
│       ├── AuthController.java       # /api/auth/register, /api/auth/login
│       ├── PatientController.java    # /api/patients
│       ├── User.java, Role.java      # DOCTOR / PATIENT accounts
│       └── SecurityConfig.java
└── frontend/                    # Angular app
    └── src/app/
        ├── login/, patient-registration/   # Auth screens
        ├── patient-dashboard/, pages/       # Patient vs. doctor dashboards
        ├── find-doctor/, booking-modal/     # Doctor search & booking flow
        ├── my-appointments/, patient-medical-records/, profile-settings/
        ├── layout/, guards/, services/      # Shared layout, route guards, AuthService
        └── app.routes.ts
```

## Prerequisites

- **Node.js** 18+ and npm
- **Java** 17 (JDK)
- **Maven** (or use the bundled `mvnw` wrapper)
- A **MongoDB Atlas** connection string (or a local MongoDB instance)

## Getting Started

### 1. Backend (Spring Boot API)

```bash
cd backend/appointment-api
```

Set your MongoDB connection string in `src/main/resources/application.properties`:

```properties
spring.application.name=appointment-api
server.port=8081
spring.mongodb.uri=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/medical_db?appName=Cluster0
```

> **Note:** this project runs Spring Boot **4.1.1**, whose MongoDB autoconfiguration moved into a separate `spring-boot-mongodb` module with the property prefix `spring.mongodb` (not the older `spring.data.mongodb`). Using the wrong prefix will silently fall back to `localhost:27017` instead of erroring.

Run the API:

```bash
./mvnw.cmd spring-boot:run   # Windows
./mvnw spring-boot:run       # macOS/Linux
```

The API starts on **http://localhost:8081**.

### 2. Frontend (Angular app)

```bash
cd frontend
npm install
npm start
```

The app starts on **http://localhost:4200** and expects the backend to be running on port 8081 (CORS is pre-configured for `localhost:4200`).

## Authentication

- Users register with a **role** (`PATIENT` or `DOCTOR`) via `/api/auth/register`; passwords are hashed with Spring Security's `PasswordEncoder`.
- `/api/auth/login` verifies credentials and returns the user profile, which the frontend's `AuthService` caches and persists to `localStorage`.
- Route guards (`patientGuard`, `doctorGuard`) protect each dashboard and redirect unauthenticated or wrong-role users to `/login`.

## Key Routes

| Path | Description | Access |
|------|-------------|--------|
| `/login` | Sign in | Public |
| `/register` | Create a patient or doctor account | Public |
| `/patient-dashboard` | Patient home (vitals, appointments, care team) | Patient |
| `/find-doctor` | Search & book a doctor | Patient |
| `/my-appointments` | Upcoming/past appointments | Patient |
| `/medical-records` | Lab results & prescriptions | Patient |
| `/profile` | Profile & account settings | Patient |
| `/dashboard` | Doctor home | Doctor |
| `/schedule`, `/patients`, `/records`, `/settings` | Doctor tools | Doctor |

## Known Limitations

- Several patient-facing pages (appointments, medical records, profile) currently render static/mock data — actions like "Reschedule," "Cancel Visit," and "Save Changes" are not yet wired to the backend.
- The booking modal collects a time slot but does not yet persist appointments to the database.
