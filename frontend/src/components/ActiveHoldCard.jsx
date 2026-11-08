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
            {effectiveStatus === 'HELD' && '⏳ আসন সংরক্ষিত (HELD)'}
            {effectiveStatus === 'CONFIRMED' && '✓ ভর্তি নিশ্চিত (CONFIRMED)'}
            {effectiveStatus === 'EXPIRED' && '⌛ মেয়াদ উত্তীর্ণ (EXPIRED)'}
            {effectiveStatus === 'CANCELLED' && '✕ বাতিলকৃত (CANCELLED)'}
          </span>
          <h2 style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
            {hold.className ? `${hold.className}` : `আবেদন আইডি: ${hold.holdId}`}
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            হোল্ড আইডি: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{hold.holdId}</code>
          </p>
        </div>

        {isHeld && (
          <div className="timer-box">
            <div>
              <div className="timer-label">মেয়াদ শেষ হতে বাকি:</div>
              <div className="timer-digits">{formattedTime}</div>
            </div>
          </div>
        )}
      </div>

      {isHeld && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95 }}>
          নির্ধারিত সময়ের মধ্যে ভর্তি ফি জমা দিন। অন্যথায় আসনটি স্বয়ংক্রিয়ভাবে পুনরায় উন্মুক্ত হয়ে যাবে।
        </p>
      )}

      {isExpired && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95, background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
          আবেদনের মেয়াদ শেষ হয়ে গেছে এবং আসনটি মুক্ত হয়ে গেছে। পুনরায় আবেদন করতে পারেন।
        </p>
      )}

      {isConfirmed && (
        <p style={{ fontSize: '0.875rem', opacity: 0.95, background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
          অভিনন্দন! আপনার ভর্তি সফলভাবে নিশ্চিত হয়েছে।
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
              💳 ভর্তি ফি দিন (Confirm Admission)
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onCancel(hold.holdId)}
              disabled={isProcessing}
            >
              ✕ বাতিল করুন (Cancel)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
