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
        <span>উপলব্ধ ক্লাস ও শিফট তালিকা (Class & Shift List)</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-600)' }}>
          🔄 প্রতি ৩ সেকেন্ড পর পর আসন স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>বর্তমানে কোনো ক্লাস তৈরি করা নেই। স্কুল অ্যাডমিন ট্যাব থেকে নতুন ক্লাস যোগ করুন।</p>
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
                      <span className="stat-label">মোট</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value held">{cls.heldSeats}</span>
                      <span className="stat-label">হোল্ড</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{cls.confirmedSeats}</span>
                      <span className="stat-label">নিশ্চিত</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value available">{cls.availableSeats}</span>
                      <span className="stat-label">খালি</span>
                    </div>
                  </div>
                </div>

                <div>
                  {hasExistingAdmission && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      ⚠️ এই ক্লাসে ইতিমধ্যে আপনার সক্রিয় আবেদন রয়েছে।
                    </p>
                  )}

                  {!isValidStudentId && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      আবেদন করতে উপরে ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => onApply(cls.id)}
                    disabled={!canApply}
                  >
                    {isFull ? '❌ আসন খালি নেই (Full)' : '📝 আবেদন করুন (Apply Now)'}
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
