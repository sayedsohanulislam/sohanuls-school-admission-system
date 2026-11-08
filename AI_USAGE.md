# AI USAGE REPORT
**Project:** School Admission System (High-Concurrency Seat Reservation)  
**Author:** Sayed Sohanul Islam  

---

### 1. AI Tools Utilized and Scope of Use
- **Tools:** Antigravity / Gemini & GitHub Copilot
- **Scope of Use:**
  - Generating initial boilerplate templates for ASP.NET Core controllers, EF Core entity models, and DTO contracts.
  - Scaffolding the React 18 / Vite component layout and modern CSS styles.
  - Designing automated xUnit concurrency test routines to simulate multi-threaded HTTP load.

---

### 2. Issues Encountered with AI Suggestions and How They Were Resolved

#### A. Inadequate Distributed Multi-Process Concurrency Protection
- **Initial AI Suggestion:** The AI originally suggested using an in-process C# lock (`SemaphoreSlim` or `lock (object)`) to protect against overbooking.
- **Problem Identified:** While an in-process lock works on a single backend instance, it fails completely across distributed processes or multi-container deployments sharing the same database (the assignment's bonus requirement). Concurrent requests landing on different instances would overbook seats.
- **Resolution:** Replaced the in-process-only approach with PostgreSQL row-level pessimistic locking (`SELECT ... FOR UPDATE`) inside an atomic database transaction. This enforces strict serialization at the database layer across any number of backend processes.

#### B. Latency in Seat Release due to Cron Dependency
- **Initial AI Suggestion:** The AI initially relied solely on a periodic background timer (running every 30–60 seconds) to find expired holds and update their status to `EXPIRED`.
- **Problem Identified:** If a hold expired between intervals, the seat would remain blocked for other applicants until the background job executed, leading to stale availability metrics.
- **Resolution:** Updated all seat-counting queries to dynamically filter by `ExpiresAt > DateTime.UtcNow && Status == 'HELD'`. This guarantees seats become immediately available at the exact millisecond of TTL expiration, while retaining the background service strictly for asynchronous database cleanup.

#### C. Incomplete Validation of the 17-Digit Student ID
- **Initial AI Suggestion:** The AI accepted any arbitrary non-empty string for the `X-Student-Id` header.
- **Problem Identified:** The specification strictly mandates a 17-digit birth registration number and requires all invalid client inputs to return `4xx` responses rather than unhandled errors.
- **Resolution:** Implemented explicit regular expression validation (`^\d{17}$`) on both the backend middleware/action filters and the frontend input controls, returning HTTP `400 Bad Request` with descriptive error messaging on invalid input.
