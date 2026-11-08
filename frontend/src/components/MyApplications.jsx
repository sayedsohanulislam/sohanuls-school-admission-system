import React from 'react';

export default function MyApplications({ 
  myHolds, 
  onConfirm, 
  onCancel, 
  isProcessing,
  studentId,
  isValidStudentId 
}) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'HELD': return 'badge-held';
      case 'CONFIRMED': return 'badge-confirmed';
      case 'EXPIRED': return 'badge-expired';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'HELD': return '⏳ আসন সংরক্ষিত (HELD)';
      case 'CONFIRMED': return '✓ ভর্তি নিশ্চিত (CONFIRMED)';
      case 'EXPIRED': return '⌛ মেয়াদ উত্তীর্ণ (EXPIRED)';
      case 'CANCELLED': return '✕ বাতিলকৃত (CANCELLED)';
      default: return status;
    }
  };

  if (!isValidStudentId) {
    return (
      <div className="card">
        <div className="card-title">আমার আবেদনসমূহ (My Applications)</div>
        <div className="empty-state">
          <p>আপনার আবেদনসমূহ দেখতে উপরে সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <span>আমার আবেদনসমূহ (My Applications)</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
          শিক্ষার্থী আইডি: <code style={{ fontWeight: 600 }}>{studentId}</code>
        </span>
      </div>

      {myHolds.length === 0 ? (
        <div className="empty-state">
          <p>এই আইডির বিপরীতে এখনো কোনো আবেদন করা হয়নি। ক্লাস তালিকা থেকে আবেদন করুন।</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>হোল্ড আইডি</th>
                <th>ক্লাস ও শিফট</th>
                <th>অবস্থা (Status)</th>
                <th>মেয়াদ শেষ হওয়ার সময়</th>
                <th>পদক্ষেপ (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {myHolds.map((h) => {
                const isHeld = h.status === 'HELD' && new Date(h.expiresAt) > new Date();
                const expiresFormatted = new Date(h.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <tr key={h.holdId}>
                    <td><code>{h.holdId}</code></td>
                    <td><strong>{h.className || h.classId}</strong></td>
                    <td>
                      <span className={`badge ${getBadgeClass(h.status)}`}>
                        {getStatusLabel(h.status)}
                      </span>
                    </td>
                    <td>{expiresFormatted}</td>
                    <td>
                      {isHeld && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onConfirm(h.holdId)}
                            disabled={isProcessing}
                          >
                            💳 ফি দিন
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onCancel(h.holdId)}
                            disabled={isProcessing}
                          >
                            ✕ বাতিল
                          </button>
                        </div>
                      )}
                      {!isHeld && <span style={{ color: 'var(--gray-600)', fontSize: '0.8125rem' }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
