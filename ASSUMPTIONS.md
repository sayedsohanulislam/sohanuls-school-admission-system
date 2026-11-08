# ASSUMPTIONS & ARCHITECTURAL DECISIONS
**Project:** School Admission System (High-Concurrency Seat Reservation & Admission Management)  
**Author:** Sayed Sohanul Islam  

---

### 1. Concurrency Strategy across Distributed Multi-Instance Backends (Bonus Requirement)
**Challenge:** Even if two or more backend processes run concurrently on separate ports/containers pointing to the same PostgreSQL database, rule #1 must never be violated: `heldSeats + confirmedSeats <= totalSeats` under any degree of race condition.

**Architecture & Implementation:**
1. **Database-Level Pessimistic Row Locking (`SELECT ... FOR UPDATE`):**
   - When a student initiates a seat hold, the backend opens an explicit database transaction with `ReadCommitted` isolation and executes:
     ```sql
     SELECT * FROM "Classes" WHERE "Id" = @classId FOR UPDATE;
     ```
   - This places a row-level exclusive lock on the requested class record in PostgreSQL. Any concurrent request attempting to reserve a seat in the same class across any process/server is queued until the active transaction completes (commits or rolls back).
   - Within the locked transaction, live counts of active `HELD` seats (where `ExpiresAt > NOW()`) and `CONFIRMED` seats are calculated. If the sum reaches `TotalSeats`, the transaction rolls back immediately and returns an HTTP `409 Conflict`.
2. **In-Memory Fallback for Test Environments:**
   - In automated test pipelines using the Entity Framework Core In-Memory database (which does not support relational row locks), a keyed `SemaphoreSlim` (`ConcurrentDictionary<string, SemaphoreSlim>`) provides strict thread-level serialization per class ID.

---

### 2. Seat Hold TTL & Automatic Expiration
- The hold duration is configurable via the `HOLD_DURATION_SECONDS` environment variable (default: `600` seconds / 10 minutes).
- **Dynamic Real-Time Resolution:** Seat availability calculation does not rely on scheduled cron jobs. All seat counting queries dynamically filter with:
  ```sql
  WHERE "ExpiresAt" > NOW() AND "Status" = 'HELD'
  ```
  Consequently, the moment a hold reaches its TTL expiration (to the exact millisecond), the seat immediately returns to the available pool for other applicants without requiring manual triggers or API calls.
- **Background Worker (`HoldCleanupBackgroundService`):** A lightweight background service runs every 5 seconds to transition expired database records from `HELD` to `EXPIRED` for database hygiene and auditing.

---

### 3. Student Identification via 17-Digit Birth Registration Number
- Per the specification, student identity is provided via the `X-Student-Id` request header representing the applicant's 17-digit birth registration certificate number.
- Both the backend API and frontend validate this value against the regular expression `^\d{17}$`.
- Missing or malformed headers return an HTTP `400 Bad Request` (never 500), complying with Rule #7.
- The student ID and active hold states are persisted in the browser's `localStorage` so user sessions persist across page reloads and browser restarts.

---

### 4. Single Active Application per Student per Class
- A student is restricted from holding more than one active reservation (`HELD` with remaining time) or confirmed admission (`CONFIRMED`) in the same class simultaneously.
- Attempting a duplicate hold in the same class returns an HTTP `409 Conflict`.
- A student may apply to a different class/shift, or re-apply if their previous hold expired or was cancelled.

---

### 5. Idempotent Fee Confirmation
- Multiple confirm requests for the same hold ID are strictly idempotent. If a hold is already marked `CONFIRMED`, subsequent calls return HTTP `200 OK` with `{ "holdId": "...", "status": "CONFIRMED" }` without re-incrementing `confirmedSeats`.
- Per the specification, clicking "Pay Admission Fee" simulates a successful payment; external payment gateway integration is mocked.

---

### 6. Cancellation & Seat Release
- Calling `DELETE /holds/{holdId}` transitions an unexpired `HELD` reservation to `CANCELLED` and returns HTTP `204 No Content`.
- The cancelled seat is instantly released and reflected in subsequent seat queries. Confirmed admissions cannot be self-cancelled by applicants.
