/**
 * Main Application Component
 * Extra Classes Register — EL SHADDAÏ KOM ABUNDANT LIFE
 * Fully authenticated with individual staff accounts,
 * database-level authorization, and Excel import/export.
 */
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, ScreenType } from './components/Header';
import { StaffAuthScreen } from './components/StaffAuthScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { StudentsScreen } from './screens/StudentsScreen';
import { SessionsScreen } from './screens/SessionsScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { ScanScreen } from './screens/ScanScreen';
import { BadgesScreen } from './screens/BadgesScreen';
import { StudentModal } from './components/StudentModal';
import { SessionModal } from './components/SessionModal';
import { PaymentModal } from './components/PaymentModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { StaffAdminModal } from './components/StaffAdminModal';
import { StudentDetailDrawer } from './components/StudentDetailDrawer';
import { StudentWithStats, Student } from './types';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    user,
    authLoading,
    studentsWithStats,
    sessions,
    attendance,
    payments,
    addStudent,
    bulkImportStudents,
    editStudent,
    removeStudent,
    addSession,
    addPayment,
    removePayment,
    currentStaffName,
    error,
    clearError,
  } = useApp();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('overview');

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isStaffAdminModalOpen, setIsStaffAdminModalOpen] = useState(false);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | null>(null);

  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
  const [activeSessionForScreen, setActiveSessionForScreen] = useState<string | null>(null);

  // Student drawer target
  const drawerStudent = drawerStudentId
    ? studentsWithStats.find((s) => s.id === drawerStudentId) || null
    : null;

  // 1. Loading state during auth resolution
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-semibold tracking-wide">
          Verifying THE BEST ACADEMY staff session...
        </p>
      </div>
    );
  }

  // 2. Strict Authentication Gate:
  // No student records, QR badge data, or registers accessible without signing in
  if (!user) {
    return <StaffAuthScreen />;
  }

  // Navigation handlers
  const handleNavigateToScanWithSession = (sessionId: string) => {
    setActiveSessionForScreen(sessionId);
    setCurrentScreen('scan');
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionForScreen(sessionId);
    setCurrentScreen('sessions');
  };

  const handleOpenEnrollModal = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = (student: StudentWithStats) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenPaymentModal = (studentId?: string) => {
    setPreselectedStudentId(studentId || null);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-rose-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header & Nav */}
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenStaffAdmin={() => setIsStaffAdminModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentScreen === 'overview' && (
          <OverviewScreen
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenEnrollModal={handleOpenEnrollModal}
            onOpenSessionModal={() => setIsSessionModalOpen(true)}
            onOpenPaymentModal={handleOpenPaymentModal}
            onSelectSession={handleSelectSession}
            onSelectStudent={(id) => setDrawerStudentId(id)}
          />
        )}

        {currentScreen === 'students' && (
          <StudentsScreen
            onOpenEnrollModal={handleOpenEnrollModal}
            onOpenImportModal={() => setIsExcelImportModalOpen(true)}
            onEditStudent={handleEditStudent}
            onSelectStudent={(id) => setDrawerStudentId(id)}
            onOpenPaymentModal={handleOpenPaymentModal}
          />
        )}

        {currentScreen === 'sessions' && (
          <SessionsScreen
            onOpenSessionModal={() => setIsSessionModalOpen(true)}
            onNavigateToScan={handleNavigateToScanWithSession}
            initialSelectedSessionId={activeSessionForScreen}
          />
        )}

        {currentScreen === 'payments' && (
          <PaymentsScreen
            onOpenPaymentModal={handleOpenPaymentModal}
            onSelectStudent={(id) => setDrawerStudentId(id)}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen
            initialSessionId={activeSessionForScreen}
            onOpenSessionModal={() => setIsSessionModalOpen(true)}
          />
        )}

        {currentScreen === 'badges' && <BadgesScreen />}
      </main>

      {/* Student Enrollment / Edit Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
        onSubmit={async (data) => {
          if (editingStudent) {
            await editStudent(editingStudent.id, data);
          } else {
            await addStudent(data);
          }
        }}
      />

      {/* Excel Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImport={bulkImportStudents}
      />

      {/* Staff Access & Security Panel Modal */}
      <StaffAdminModal
        isOpen={isStaffAdminModalOpen}
        onClose={() => setIsStaffAdminModalOpen(false)}
      />

      {/* Log Session Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        defaultTeacher={currentStaffName}
        onSubmit={async (data) => {
          const newId = await addSession(data);
          setActiveSessionForScreen(newId);
          return newId;
        }}
        onSessionCreated={(id) => {
          setActiveSessionForScreen(id);
          setCurrentScreen('sessions');
        }}
      />

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPreselectedStudentId(null);
        }}
        students={studentsWithStats}
        preselectedStudentId={preselectedStudentId}
        recordedByName={currentStaffName}
        onSubmit={async (data) => {
          return await addPayment(data);
        }}
      />

      {/* Student Profile & History Drawer */}
      <StudentDetailDrawer
        student={drawerStudent}
        onClose={() => setDrawerStudentId(null)}
        sessions={sessions}
        attendance={attendance}
        payments={payments}
        onOpenPaymentModal={handleOpenPaymentModal}
        onEditStudent={handleEditStudent}
        onDeleteStudent={async (id) => {
          await removeStudent(id);
        }}
        onDeletePayment={async (id) => {
          await removePayment(id);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-700">
            THE BEST ACADEMY • Extra Classes Tutoring Register
          </p>
          <p className="text-[11px] text-slate-400">
            Authenticated Staff Session • Database Security Active • AES Encryption at Rest
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
