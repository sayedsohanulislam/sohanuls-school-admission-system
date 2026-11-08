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
        <span>নতুন ক্লাস / শিফট তৈরি করুন (School Admin)</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
        প্রতিটি শিফট আলাদা একটি ক্লাস হিসেবে যুক্ত হবে এবং তার নিজস্ব আসন সংখ্যা থাকবে।
      </p>

      {/* Preset shortcuts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 6 – Morning Shift', 120)}
        >
          + Class 6 – Morning (120)
        </button>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 6 – Day Shift', 120)}
        >
          + Class 6 – Day (120)
        </button>
        <button 
          type="button" 
          className="btn-secondary-sm"
          onClick={() => handleQuickFill('Class 9 – Science Morning', 80)}
        >
          + Class 9 – Science (80)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="className">ক্লাস ও শিফটের নাম</label>
          <input
            id="className"
            type="text"
            className="form-control"
            placeholder="যেমন: Class 6 – Morning Shift"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="totalSeats">মোট আসন সংখ্যা</label>
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
          {isProcessing ? 'তৈরি হচ্ছে...' : '➕ ক্লাস যোগ করুন'}
        </button>
      </form>
    </div>
  );
}
