import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import CreateClassModal from './components/CreateClassModal';
import ClassList from './components/ClassList';
import ActiveHoldCard from './components/ActiveHoldCard';
import MyApplications from './components/MyApplications';
import { api } from './api/client';

export default function App() {
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem('school_student_id') || '20261234567890123';
  });
  const [classes, setClasses] = useState([]);
  const [myHolds, setMyHolds] = useState([]);
  const [activeTab, setActiveTab] = useState('student');
  const [alert, setAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Fetch all classes
  const loadClasses = useCallback(async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err) {
      // Do not spam alerts on periodic poll failure
      console.error('Error fetching classes:', err);
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
      showAlert('আবেদন করতে অনুগ্রহ করে উপরে সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।', 'warning');
      return;
    }

    setIsProcessing(true);
    setAlert(null);

    try {
      const response = await api.createHold(classId, studentId);
      showAlert(`আসন সাময়িকভাবে সংরক্ষিত হয়েছে (হোল্ড আইডি: ${response.holdId})। নির্ধারিত সময়ের মধ্যে ভর্তি ফি প্রদান করুন।`, 'success');
      await Promise.all([loadClasses(), loadMyHolds()]);
      setActiveTab('student');
    } catch (err) {
      if (err.status === 409) {
        showAlert('দুঃখিত! এই ক্লাসে কোনো আসন খালি নেই অথবা এই ক্লাসে ইতিমধ্যে আপনার একটি সক্রিয় আবেদন রয়েছে।', 'danger');
      } else if (err.status === 400) {
        showAlert('অনুরোধটি সঠিক নয়। ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর নিশ্চিত করুন।', 'danger');
      } else {
        showAlert(err.message || 'আবেদন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'danger');
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
      showAlert('ভর্তি ফি সফলভাবে জমা হয়েছে এবং ভর্তি নিশ্চিত হয়েছে!', 'success');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } catch (err) {
      showAlert(err.message || 'ভর্তি ফি প্রদানে সমস্যা হয়েছে। আসনটির মেয়াদ শেষ হয়ে থাকতে পারে।', 'danger');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel Hold
  const handleCancel = async (holdId) => {
    if (!isValidStudentId) return;

    if (!window.confirm('আপনি কি নিশ্চিত যে আবেদনটি বাতিল করতে চান? আসনটি পুনরায় উন্মুক্ত হয়ে যাবে।')) {
      return;
    }

    setIsProcessing(true);
    setAlert(null);

    try {
      await api.cancelHold(holdId, studentId);
      showAlert('আবেদন বাতিল করা হয়েছে এবং আসনটি মুক্ত করা হয়েছে।', 'warning');
      await Promise.all([loadClasses(), loadMyHolds()]);
    } catch (err) {
      showAlert(err.message || 'আবেদন বাতিল করতে সমস্যা হয়েছে।', 'danger');
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
      showAlert(`নতুন ক্লাস "${newClass.name}" (${newClass.totalSeats} আসন) সফলভাবে তৈরি করা হয়েছে!`, 'success');
      await loadClasses();
      setActiveTab('student');
    } catch (err) {
      showAlert(err.message || 'ক্লাস তৈরি করতে সমস্যা হয়েছে।', 'danger');
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
        {alert && (
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
            🏫 ভর্তি ও আসন তালিকা (Admissions)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'my-holds' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-holds')}
          >
            📋 আমার আবেদনসমূহ ({myHolds.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ স্কুল অ্যাডমিন (ক্লাস যোগ করুন)
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
