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
          <div className="brand-icon">ভ</div>
          <div>
            <h1 className="brand-title">অনলাইন স্কুল ভর্তি সিস্টেম</h1>
            <p className="brand-subtitle">School Admission System · First-Come, First-Served</p>
          </div>
        </div>

        <div className="student-bar">
          <label htmlFor="student-id-input">শিক্ষার্থীর ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর:</label>
          <input
            id="student-id-input"
            type="text"
            className="student-input"
            placeholder="১৭ অঙ্কের নম্বর দিন"
            maxLength={17}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
          />
          <button 
            type="button" 
            className="btn-secondary-sm"
            onClick={generateRandomStudentId}
            title="পরীক্ষার জন্য একটি ডেমো ১৭ অঙ্কের আইডি তৈরি করুন"
          >
            🎲 ডেমো আইডি
          </button>
          {studentId && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isValidStudentId ? 'var(--success)' : 'var(--danger)' }}>
              {isValidStudentId ? '✓ সঠিক আইডি' : `(${studentId.length}/17 অঙ্ক)`}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
