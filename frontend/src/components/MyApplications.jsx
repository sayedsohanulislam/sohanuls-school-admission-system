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
      case 'HELD': return '⏳ HELD';
      case 'CONFIRMED': return '✓ CONFIRMED';
      case 'EXPIRED': return '⌛ EXPIRED';
      case 'CANCELLED': return '✕ CANCELLED';
      default: return status;
    }
  };

  if (!isValidStudentId) {
    return (
      <div className="card">
        <div className="card-title">My Applications</div>
        <div className="empty-state">
          <p>Please enter a valid 17-digit birth registration ID in the header to view your applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <span>My Applications</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
          Student ID: <code style={{ fontWeight: 600 }}>{studentId}</code>
        </span>
      </div>

      {myHolds.length === 0 ? (
        <div className="empty-state">
          <p>No applications found for this student ID. Browse available classes to apply.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hold ID</th>
                <th>Class & Shift</th>
                <th>Status</th>
                <th>Expires At</th>
                <th>Actions</th>
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
                            💳 Pay Fee
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onCancel(h.holdId)}
                            disabled={isProcessing}
                          >
                            ✕ Cancel
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
