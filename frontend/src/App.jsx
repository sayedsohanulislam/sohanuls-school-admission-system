import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import CreateClassModal from './components/CreateClassModal';
import ClassList from './components/ClassList';
import ActiveHoldCard from './components/ActiveHoldCard';
import MyApplications from './components/MyApplications';
import { api, getDemoMode, setDemoMode, getApiBase } from './api/client';

export default function App() {
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem('school_student_id') || '20261234567890123';
  });
  const [classes, setClasses] = useState([]);
  const [myHolds, setMyHolds] = useState([]);
  const [activeTab, setActiveTab] = useState('student');
  const [alert, setAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoMode, setDemoModeState] = useState(getDemoMode());

  // Validate 17-digit student birth registration ID
  const isValidStudentId = useMemo(() => {
    return /^\d{17}$/.test(studentId);
  }, [studentId]);

  // Persist studentId in localStorage
  useEffect(() => {
    if (studentId) {
      localStorage.setItem('school_student_id', studentId);
    }
  }, [studentId]);

  const showAlert = (message, type = 'danger') => {
    setAlert({ message, type });
    if (type === 'success') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleToggleDemoMode = (enabled) => {
    setDemoMode(enabled);
    setDemoModeState(enabled);
    setAlert(null);
    loadClasses();
    if (isValidStudentId) {
      loadMyHolds();
    }
  };

  // Fetch all classes
  const loadClasses = useCallback(async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      if (!getDemoMode()) {
        showAlert(
          `Unable to reach backend API at ${getApiBase()}. (Note: On HTTPS sites like Vercel, browsers block HTTP localhost requests due to Mixed Content security rules).`,
          'danger'
        );
      }
    }
  }, []);

  // Fetch current student's applications
  const loadMyHolds = useCallback(async () => {
    if (!isValidStudentId) {
      setMyHolds([]);
      return;
    }
    try {
      const data = await api.getMyHolds(studentId);
      setMyHolds(data);
    } catch (err) {
      console.error('Error fetching student holds:', err);
    }
  }, [studentId, isValidStudentId]);

  // Initial load
  useEffect(() => {
    loadClasses();
    loadMyHolds();
  }, [loadClasses, loadMyHolds]);

  // Real-time polling every 3 seconds for class seats
  useEffect(() => {
    const interval = setInterval(() => {
      loadClasses();
      if (isValidStudentId) {
        loadMyHolds();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [loadClasses, loadMyHolds, isValidStudentId]);

  // Find the current active hold (HELD status and not expired)
  const currentActiveHold = useMemo(() => {
    const now = new Date();
    return myHolds.find(h => h.status === 'HELD' && new Date(h.expiresAt) > now) || null;
  }, [myHolds]);

  // Handle Apply (Create Hold)
  const handleApply = async (classId) => {
    if (!isValidStudentId) {
      showAlert('Please enter a valid 17-digit student birth registration ID in the header to apply.', 'warning');
      return;
    }

    setIsProcessing(true);
    setAlert(null);

    try {
      const response = await api.createHold(classId, studentId);
      showAlert(`Seat held successfully! (Hold ID: ${response.holdId}). Please pay the admission fee before the timer expires.`, 'success');
      await Promise.all([loadClasses(), loadMyHolds()]);
      setActiveTab('student');
    } catch (err) {
      if (err.status === 409) {
        showAlert('Application rejected: No seats are currently available or you already hold an active reservation/admission in this class.', 'danger');
      } else if (err.status === 400) {
        showAlert('Invalid input: The X-Student-Id must be a valid 17-digit birth registration number.', 'danger');
      } else {
        showAlert(err.message || 'Failed to submit application. Please try again.', 'danger');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirm Payment
  const handleConfirm = async (holdId) => {
    if (!isValidStudentId) return;

    setIsProcessing(true);
    setAlert(null);

    try {
      await api.confirmHold(holdId, studentId);
      showAlert('Payment successful! Your admission has been confirmed.', 'success');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } catch (err) {
      showAlert(err.message || 'Failed to process admission fee. The hold reservation may have expired.', 'danger');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel Hold
  const handleCancel = async (holdId) => {
    if (!isValidStudentId) return;

    if (!window.confirm('Are you sure you want to cancel this reservation? The seat will be released immediately.')) {
      return;
    }

    setIsProcessing(true);
    setAlert(null);

    try {
      await api.cancelHold(holdId, studentId);
      showAlert('Reservation cancelled and seat released.', 'warning');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } catch (err) {
      showAlert(err.message || 'Failed to cancel reservation.', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Class Creation (Admin)
  const handleCreateClass = async (name, totalSeats) => {
    setIsProcessing(true);
    setAlert(null);

    try {
      const newClass = await api.createClass(name, totalSeats);
      showAlert(`Class "${newClass.name}" with ${newClass.totalSeats} seats was created successfully!`, 'success');
      await loadClasses();
      setActiveTab('student');
    } catch (err) {
      showAlert(err.message || 'Failed to create class.', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Header 
        studentId={studentId} 
        setStudentId={setStudentId} 
        isValidStudentId={isValidStudentId} 
      />

      <main className="container">
        {/* Environment / Demo Banner */}
        {demoMode ? (
          <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>
              ⚡ <strong>Interactive Demo Mode Active:</strong> Simulating real-time seat holds, countdown timers, and admissions in-browser. (Ideal for testing on Vercel without a local .NET backend).
            </span>
            <button 
              className="btn-secondary-sm"
              onClick={() => handleToggleDemoMode(false)}
            >
              Switch to Live Backend Mode
            </button>
          </div>
        ) : (
          alert && alert.type === 'danger' && alert.message.includes('Unable to reach backend') && (
            <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                💡 <strong>Testing on Vercel?</strong> Browsers block HTTPS pages from calling local HTTP backends (Mixed Content). You can activate Demo Mode to interact with the full UI right now.
              </span>
              <button 
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                onClick={() => handleToggleDemoMode(true)}
              >
                🚀 Enable Interactive Demo Mode
              </button>
            </div>
          )
        )}

        {alert && (!demoMode || alert.type !== 'danger' || !alert.message.includes('Unable to reach backend')) && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.message}</span>
            <button className="alert-close" onClick={() => setAlert(null)}>×</button>
          </div>
        )}

        {/* Active Hold Live Countdown Banner (Always visible when a seat is held) */}
        {currentActiveHold && (
          <ActiveHoldCard
            hold={currentActiveHold}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        )}

        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            🏫 Classes & Admissions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'my-holds' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-holds')}
          >
            📋 My Applications ({myHolds.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ School Admin (Add Class)
          </button>
        </div>

        {/* Tab 1: Student / Admissions */}
        {activeTab === 'student' && (
          <ClassList
            classes={classes}
            onApply={handleApply}
            isProcessing={isProcessing}
            studentId={studentId}
            isValidStudentId={isValidStudentId}
            myHolds={myHolds}
          />
        )}

        {/* Tab 2: My Applications */}
        {activeTab === 'my-holds' && (
          <MyApplications
            myHolds={myHolds}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isProcessing={isProcessing}
            studentId={studentId}
            isValidStudentId={isValidStudentId}
          />
        )}

        {/* Tab 3: Admin */}
        {activeTab === 'admin' && (
          <CreateClassModal
            onCreateClass={handleCreateClass}
            isProcessing={isProcessing}
          />
        )}
      </main>
    </div>
  );
}
