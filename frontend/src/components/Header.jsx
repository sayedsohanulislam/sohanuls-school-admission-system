import React from 'react';

export default function Header({ studentId, setStudentId, isValidStudentId }) {
  const generateRandomStudentId = () => {
    // Generate a valid 17-digit number starting with 2026
    const randomDigits = Math.floor(1000000000000 + Math.random() * 9000000000000);
    const newId = `2026${randomDigits}`;
    setStudentId(newId);
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-icon">SA</div>
          <div>
            <h1 className="brand-title">School Admission System</h1>
            <p className="brand-subtitle">High-Concurrency Seat Reservation · First-Come, First-Served</p>
          </div>
        </div>

        <div className="student-bar">
          <label htmlFor="student-id-input">Student 17-Digit Birth Registration ID:</label>
          <input
            id="student-id-input"
            type="text"
            className="student-input"
            placeholder="17-digit ID"
            maxLength={17}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
          />
          <button 
            type="button" 
            className="btn-secondary-sm"
            onClick={generateRandomStudentId}
            title="Generate a random 17-digit test ID"
          >
            🎲 Demo ID
          </button>
          {studentId && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isValidStudentId ? 'var(--success)' : 'var(--danger)' }}>
              {isValidStudentId ? '✓ Valid ID' : `(${studentId.length}/17 digits)`}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
