# School Admission System (High-Concurrency Seat Reservation)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://sohanuls-school-admission-system.vercel.app)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-quick-start-docker)
[![.NET 8](https://img.shields.io/badge/.NET_8-Web_API-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A production-ready, containerized School Admission System built for high-traffic, first-come-first-served (FCFS) seat reservations and admission fee processing without lottery. Designed to handle peak registration surges while strictly guaranteeing zero seat overbooking.

Developed for **Onnorokom Projukti Limited** Take-Home Assignment (Assistant Software Engineer recruitment).

---

## 🌐 Live Interactive Preview (Vercel)

You can review and interact with the application live in your browser:

🔗 **Live Deployment:** **[https://sohanuls-school-admission-system.vercel.app](https://sohanuls-school-admission-system.vercel.app)**

> **Cloud Preview Note:** When visited on Vercel, the app automatically runs in **Interactive Cloud Mode** with full in-browser simulation (dynamic seat quotas, 17-digit student ID validation, live expiration countdown timers, fee confirmations, and cancellations). To test the full-stack system with the actual .NET 8 Web API and PostgreSQL database, run the Docker Compose setup below.

---

## 🚀 Quick Start (Docker)

The entire full-stack application (PostgreSQL, .NET 8 Backend, and React Frontend) can be launched with a single command without installing local runtimes or databases:

```bash
docker compose up --build
```

### Application URLs:
- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Backend Health Check:** [http://localhost:8080/health](http://localhost:8080/health)
- **Database:** PostgreSQL on `localhost:5432` (`db: school_admission`, `user: postgres`, `pass: postgres`)

---

## 🛠️ Tech Stack & Architecture

- **Backend:** C# (.NET 8 Web API), Entity Framework Core
- **Database:** PostgreSQL 16 with ACID transactions and row-level pessimistic locking (`SELECT ... FOR UPDATE`)
- **Frontend:** React, Vite, Modern Responsive CSS
- **Orchestration:** Multi-stage Dockerfiles & `docker-compose.yml`
- **Testing:** xUnit, `Microsoft.AspNetCore.Mvc.Testing` (concurrency simulation), Vitest & Testing Library

---

## 🧪 Running Automated Tests

### 1. Backend Tests (Includes High-Concurrency Test)
To run the automated backend test suite:
```bash
dotnet test backend/SchoolAdmission.sln
```

**Test Suite Coverage:**
- `ConcurrencyTests.cs`: Simulates 30 parallel concurrent student requests competing for only 5 available seats. Verifies that exactly 5 succeed (201 Created), 25 fail with 409 Conflict, and `heldSeats + confirmedSeats <= totalSeats` is strictly guaranteed without race condition overbooking.
- `AdmissionValidationTests.cs`: Verifies 17-digit birth certificate number validation, duplicate hold prevention in the same class, idempotent confirmation, and cancellation seat release.
- `HoldExpirationTests.cs`: Verifies hold TTL expiration, automatic seat release back to available pool, and rejection of fee payment on expired holds.

### 2. Frontend Tests
To run the frontend component and UI tests:
```bash
cd frontend
npm test
```

---

## 📋 REST API Endpoints Contract

Base URL: `http://localhost:8080`  
Header for student requests: `X-Student-Id` (17-digit birth registration number string)

| # | Method | Path | Description | Headers / Body | Success Response |
|---|---|---|---|---|---|
| 1 | `POST` | `/classes` | Create new class & shift | `{"name": "...", "totalSeats": 120}` | `201 Created` |
| 2 | `GET` | `/classes` | List all classes & live seats | - | `200 OK` |
| 3 | `GET` | `/classes/{classId}` | Get single class seat details | - | `200 OK` |
| 4 | `POST` | `/classes/{classId}/holds` | Apply / Hold a seat | `X-Student-Id: <17-digits>` | `201 Created` (or `409 Conflict`) |
| 5 | `GET` | `/holds/{holdId}` | Current hold status | - | `200 OK` (`HELD`/`CONFIRMED`/`EXPIRED`/`CANCELLED`) |
| 6 | `POST` | `/holds/{holdId}/confirm` | Pay admission fee & confirm | `X-Student-Id: <17-digits>` | `200 OK` |
| 7 | `DELETE` | `/holds/{holdId}` | Cancel application | `X-Student-Id: <17-digits>` | `204 No Content` |
| 8 | `GET` | `/me/holds` | Get applicant's applications | `X-Student-Id: <17-digits>` | `200 OK` |

---

## 🔒 Business Rules & Guarantees

1. **Anti-Overbooking Guarantee:** Under no condition can `heldSeats + confirmedSeats` exceed `totalSeats`. Row-level database locks ensure complete serialization across distributed backend instances.
2. **Automated Seat Release:** Hold TTL is governed by `HOLD_DURATION_SECONDS` (default: 600s / 10 minutes). Real-time dynamic SQL filtering releases seats immediately at the millisecond of expiration.
3. **Single Active Hold Policy:** A student can hold only 1 active seat or confirmed admission per class at a time.
4. **Idempotency:** Re-confirming an already confirmed hold returns `200 OK` without duplicating seat counts.
5. **Data Persistence:** Database volumes persist across `docker compose down` and `docker compose up`.

---

## 📁 Repository Structure

```
.
├── .gitignore
├── docker-compose.yml
├── README.md
├── ASSUMPTIONS.md
├── AI_USAGE.md
├── backend/
│   ├── Dockerfile
│   ├── SchoolAdmission.sln
│   ├── src/
│   │   └── SchoolAdmission.Api/
│   │       ├── Controllers/
│   │       ├── Data/
│   │       ├── Dtos/
│   │       ├── Models/
│   │       ├── Services/
│   │       ├── Program.cs
│   │       └── SchoolAdmission.Api.csproj
│   └── tests/
│       └── SchoolAdmission.Tests/
│           ├── ConcurrencyTests.cs
│           ├── AdmissionValidationTests.cs
│           ├── HoldExpirationTests.cs
│           └── SchoolAdmission.Tests.csproj
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/
        └── api/
```
