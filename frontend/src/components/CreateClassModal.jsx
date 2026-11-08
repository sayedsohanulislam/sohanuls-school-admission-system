import React, { useState } from 'react';

export default function CreateClassModal({ onCreateClass, isProcessing }) {
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState(60);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || totalSeats <= 0) return;
    onCreateClass(name.trim(), Number(totalSeats));
    setName('');
  };

  const handleQuickFill = (presetName, presetSeats) => {
    setName(presetName);
    setTotalSeats(presetSeats);
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>Create Class & Shift (School Admin)</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
        Each shift is treated as an independent class entity with its own dedicated seat allocation.
      </p>

      {/* Preset shortcuts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 6 – Morning Shift', 120)}
        >
          + Class 6 – Morning (120 seats)
        </button>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 6 – Day Shift', 120)}
        >
          + Class 6 – Day (120 seats)
        </button>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 9 – Science Morning', 80)}
        >
          + Class 9 – Science (80 seats)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="className">Class & Shift Name</label>
          <input
            id="className"
            type="text"
            className="form-control"
            placeholder="e.g. Class 6 – Morning Shift"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="totalSeats">Total Seats</label>
          <input
            id="totalSeats"
            type="number"
            className="form-control"
            min={1}
            max={10000}
            value={totalSeats}
            onChange={(e) => setTotalSeats(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isProcessing || !name.trim() || totalSeats <= 0}
        >
          {isProcessing ? 'Creating...' : '➕ Create Class'}
        </button>
      </form>
    </div>
  );
}
