/**
 * OverviewScreen
 * Main dashboard: stat tiles, recent sessions, and largest outstanding fee balances
 */
import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCFA, formatDate } from '../lib/formatters';
import {
  Users,
  CalendarDays,
  Percent,
  Coins,
  QrCode,
  PlusCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface OverviewScreenProps {
  onNavigate: (screen: 'students' | 'sessions' | 'payments' | 'scan' | 'badges') => void;
  onOpenEnrollModal: () => void;
  onOpenSessionModal: () => void;
  onOpenPaymentModal: (studentId?: string) => void;
  onSelectSession: (sessionId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  onNavigate,
  onOpenEnrollModal,
  onOpenSessionModal,
  onOpenPaymentModal,
  onSelectSession,
  onSelectStudent,
}) => {
  const {
    students,
    sessions,
    totalFeesOutstanding,
    overallAttendanceRateLast10,
    recentSessions,
    topDebtors,
    loadSampleData,
    dataLoading,
  } = useApp();

  return (
    <div className="space-y-6">
      {/* School Banner Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <QrCode className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            THE BEST ACADEMY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Extra Classes Register
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Tutoring program source of truth: student enrollment, live attendance tracking with QR badges, and real-time fee balance management.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 mt-6">
            <button
              onClick={() => onNavigate('scan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Badges
            </button>
            <button
              onClick={onOpenSessionModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Log Session
            </button>
            <button
              onClick={onOpenEnrollModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors"
            >
              <Users className="w-4 h-4" />
              Enroll Student
            </button>
            <button
              onClick={() => onOpenPaymentModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Students Enrolled */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Students Enrolled
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            Across 7 secondary levels
          </p>
        </div>

        {/* Tile 2: Sessions Logged */}
        <div
          onClick={() => onNavigate('sessions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sessions Run
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{sessions.length}</p>
          <p className="text-xs text-slate-500 mt-1">Extra classes logged</p>
        </div>

        {/* Tile 3: Attendance Rate (Last 10 sessions) */}
        <div
          onClick={() => onNavigate('sessions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {overallAttendanceRateLast10}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Over last 10 sessions</p>
        </div>

        {/* Tile 4: Total Fees Outstanding */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fees Outstanding
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-3 truncate">
            {formatCFA(totalFeesOutstanding)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total balances owed</p>
        </div>
      </div>

      {/* EMPTY STATE HELPER IF NO DATA */}
      {students.length === 0 && !dataLoading && (
        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Students or Sessions in Database Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            You can either enroll your first student manually or load sample starter data for THE BEST ACADEMY.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onOpenEnrollModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Enroll Student Manually
            </button>
            <button
              onClick={loadSampleData}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 transition-colors"
            >
              Load Sample Roster & Sessions
            </button>
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID: RECENT SESSIONS & LARGEST BALANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions (6 most recent) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Sessions</h2>
              <p className="text-xs text-slate-500">Last 6 tutoring classes conducted</p>
            </div>
            <button
              onClick={() => onNavigate('sessions')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 p-1 hover:bg-slate-50 rounded"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No tutoring sessions logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {session.subject}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800">
                        {session.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(session.date)} • Teacher: {session.teacher || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      Attendance
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Students with Largest Outstanding Balance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Fees Outstanding</h2>
              <p className="text-xs text-slate-500">Top 5 students with pending balances</p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 p-1 hover:bg-slate-50 rounded"
            >
              Full Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topDebtors.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="font-medium text-slate-700">All student fees are fully paid!</p>
              <p className="text-xs text-slate-400 mt-0.5">No outstanding balances remaining.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topDebtors.map((student) => (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-all flex items-center justify-between"
                >
                  <div
                    onClick={() => onSelectStudent(student.id)}
                    className="cursor-pointer flex-1 mr-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {student.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-200 text-slate-700">
                        {student.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fee: {formatCFA(student.termly_fee)} • Paid: {formatCFA(student.totalPaid)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-600">
                      {formatCFA(student.balance)}
                    </span>
                    <button
                      onClick={() => onOpenPaymentModal(student.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
                      title="Collect payment"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
