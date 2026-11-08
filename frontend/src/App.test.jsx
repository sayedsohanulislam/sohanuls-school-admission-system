import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from './components/Header';
import ActiveHoldCard from './components/ActiveHoldCard';
import CreateClassModal from './components/CreateClassModal';

describe('Frontend Component Tests', () => {
  it('Header renders correctly with student ID validation', () => {
    const setStudentId = vi.fn();
    render(
      <Header 
        studentId="20261234567890123" 
        setStudentId={setStudentId} 
        isValidStudentId={true} 
      />
    );

    expect(screen.getByText(/School Admission System/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('20261234567890123')).toBeInTheDocument();
    expect(screen.getByText('✓ Valid ID')).toBeInTheDocument();
  });

  it('ActiveHoldCard displays countdown and action buttons for HELD status', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const futureDate = new Date(Date.now() + 600000).toISOString(); // 10 mins in future

    const hold = {
      holdId: 'h_test123',
      className: 'Class 6 - Morning Shift',
      status: 'HELD',
      expiresAt: futureDate
    };

    render(
      <ActiveHoldCard
        hold={hold}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isProcessing={false}
      />
    );

    expect(screen.getByText(/Seat Reserved \(HELD\)/i)).toBeInTheDocument();
    expect(screen.getByText('h_test123')).toBeInTheDocument();
    
    const confirmBtn = screen.getByText(/Pay Admission Fee/i);
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith('h_test123');

    const cancelBtn = screen.getByText(/Cancel Reservation/i);
    expect(cancelBtn).not.toBeDisabled();
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledWith('h_test123');
  });

  it('CreateClassModal accepts input and triggers create', () => {
    const onCreateClass = vi.fn();
    render(<CreateClassModal onCreateClass={onCreateClass} isProcessing={false} />);

    const nameInput = screen.getByPlaceholderText(/e.g. Class 6 – Morning Shift/i);
    const seatsInput = screen.getByLabelText(/Total Seats/i);
    const submitBtn = screen.getByRole('button', { name: /Create Class/i });

    fireEvent.change(nameInput, { target: { value: 'Class 10 - Science' } });
    fireEvent.change(seatsInput, { target: { value: '75' } });
    fireEvent.click(submitBtn);

    expect(onCreateClass).toHaveBeenCalledWith('Class 10 - Science', 75);
  });
});
