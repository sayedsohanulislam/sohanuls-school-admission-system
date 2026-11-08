import React, { useState, useEffect } from 'react';

export default function ActiveHoldCard({ hold, onConfirm, onCancel, isProcessing }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!hold || !hold.expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(hold.expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
        setIsExpired(false);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [hold]);

  if (!hold) return null;

  const effectiveStatus = isExpired ? 'EXPIRED' : hold.status;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isConfirmed = effectiveStatus === 'CONFIRMED';
  const isHeld = effectiveStatus === 'HELD';

  return (
    <div className={`active-hold-card ${isExpired ? 'expired' : isConfirmed ? 'confirmed' : ''}`}>
      <div className="hold-header">
        <div>
          <span className="hold-badge">
            {effectiveStatus === 'HELD' && '⏳ Seat Reserved (HELD)'}
            {effectiveStatus === 'CONFIRMED' && '✓ Admission Confirmed (CONFIRMED)'}
            {effectiveStatus === 'EXPIRED' && '⌛ Expired (EXPIRED)'}
            {effectiveStatus === 'CANCELLED' && '✕ Cancelled (CANCELLED)'}
          </span>
          <h2 style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
            {hold.className ? `${hold.className}` : `Hold ID: ${hold.holdId}`}
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Hold Reference: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{hold.holdId}</code>
          </p>
        </div>

        {isHeld && (
          <div className="timer-box">
            <div>
              <div className="timer-label">Time Remaining to Pay:</div>
              <div className="timer-digits">{formattedTime}</div>
            </div>
          </div>
        )}
      </div>

      {isHeld && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95 }}>
          Pay the admission fee before the timer expires. If time runs out, the seat will automatically be released for other applicants.
        </p>
      )}

      {isExpired && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95, background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
          This hold reservation has expired and the seat has been returned to the available pool. You may apply again if seats remain.
        </p>
      )}

      {isConfirmed && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95, background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
          Congratulations! Your admission has been confirmed.
        </p>
      )}

      <div className="hold-actions">
        {isHeld && (
          <>
            <button
              className="btn btn-success"
              onClick={() => onConfirm(hold.holdId)}
              disabled={isProcessing || isExpired}
            >
              💳 Pay Admission Fee (Confirm)
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onCancel(hold.holdId)}
              disabled={isProcessing}
            >
              ✕ Cancel Reservation
            </button>
          </>
        )}
      </div>
    </div>
  );
}
