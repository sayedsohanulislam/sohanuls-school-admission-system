import React from 'react';

export default function ClassList({ 
  classes, 
  onApply, 
  isProcessing, 
  studentId, 
  isValidStudentId,
  myHolds
}) {
  // Check if current student has active hold or confirmed seat in each class
  const isClassDisabledForStudent = (classId) => {
    if (!myHolds || myHolds.length === 0) return false;
    const now = new Date();
    return myHolds.some(h => 
      h.classId === classId && 
      (h.status === 'CONFIRMED' || (h.status === 'HELD' && new Date(h.expiresAt) > now))
    );
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>Available Classes & Shifts</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-600)' }}>
          🔄 Real-time seat updates every 3s
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>No classes created yet. Switch to the School Admin tab to add classes.</p>
        </div>
      ) : (
        <div className="class-grid">
          {classes.map((cls) => {
            const hasExistingAdmission = isClassDisabledForStudent(cls.id);
            const isFull = cls.availableSeats <= 0;
            const canApply = isValidStudentId && !isFull && !hasExistingAdmission && !isProcessing;

            return (
              <div key={cls.id} className="class-card">
                <div>
                  <h3 className="class-name">{cls.name}</h3>
                  
                  <div className="seat-stats">
                    <div className="stat-item">
                      <span className="stat-value">{cls.totalSeats}</span>
                      <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value held">{cls.heldSeats}</span>
                      <span className="stat-label">Held</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{cls.confirmedSeats}</span>
                      <span className="stat-label">Confirmed</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value available">{cls.availableSeats}</span>
                      <span className="stat-label">Available</span>
                    </div>
                  </div>
                </div>

                <div>
                  {hasExistingAdmission && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      ⚠️ You already have an active hold or confirmed admission in this class.
                    </p>
                  )}

                  {!isValidStudentId && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      Enter your 17-digit birth registration ID in the header to apply.
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => onApply(cls.id)}
                    disabled={!canApply}
                  >
                    {isFull ? '❌ No Seats Available (Full)' : '📝 Apply for Seat (Hold)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
