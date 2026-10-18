/**
 * SessionsScreen: Manage tutoring sessions and live attendance register
 * Tapping a session opens the tactile attendance register for students at that level.
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SessionWithStats, StudentLevel, ALL_LEVELS } from '../types';
import { formatDate, formatDateTime, playChime } from '../lib/formatters';
import { exportSessionAttendancePDF, exportSessionAttendanceCSV } from '../lib/exportUtils';
import { exportSessionAttendanceToExcel } from '../lib/excelUtils';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  QrCode,
  FileText,
  Download,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Volume2,
  FileSpreadsheet,
} from 'lucide-react';

interface SessionsScreenProps {
  onOpenSessionModal: () => void;
  onNavigateToScan: (sessionId: string) => void;
  initialSelectedSessionId?: string | null;
}

export const SessionsScreen: React.FC<SessionsScreenProps> = ({
  onOpenSessionModal,
  onNavigateToScan,
  initialSelectedSessionId,
}) => {
  const {
    sessionsWithStats,
    students,
    attendance,
    markAttendance,
    markAllAttendance,
    removeSession,
  } = useApp();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSelectedSessionId || (sessionsWithStats.length > 0 ? sessionsWithStats[0].id : null)
  );
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active session
  const activeSession = useMemo(() => {
    return sessionsWithStats.find((s) => s.id === selectedSessionId) || sessionsWithStats[0] || null;
  }, [sessionsWithStats, selectedSessionId]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessionsWithStats.filter((session) => {
      if (levelFilter !== 'ALL' && session.level !== levelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSubj = session.subject.toLowerCase().includes(q);
        const matchesTeacher = (session.teacher || '').toLowerCase().includes(q);
        const matchesDate = session.date.includes(q);
        return matchesSubj || matchesTeacher || matchesDate;
      }
      return true;
    });
  }, [sessionsWithStats, levelFilter, searchQuery]);

  // Eligible students for the active session (level match)
  const eligibleStudents = useMemo(() => {
    if (!activeSession) return [];
    return students.filter((s) => s.level === activeSession.level);
  }, [students, activeSession]);

  // Current session attendance marks map: studentId -> boolean
  const currentMarksMap = useMemo(() => {
    if (!activeSession) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    attendance
      .filter((m) => m.sessionId === activeSession.id)
      .forEach((m) => map.set(m.studentId, m.present));
    return map;
  }, [attendance, activeSession]);

  // Handlers
  const handleToggleAttendance = async (studentId: string, currentPresent: boolean | undefined) => {
    if (!activeSession) return;
    const nextPresent = currentPresent === true ? false : true;
    playChime(nextPresent ? 'present' : 'absent');
    await markAttendance(activeSession.id, studentId, nextPresent);
  };

  const handleMarkAll = async (present: boolean) => {
    if (!activeSession || eligibleStudents.length === 0) return;
    playChime(present ? 'present' : 'absent');
    const studentIds = eligibleStudents.map((s) => s.id);
    await markAllAttendance(activeSession.id, studentIds, present);
  };

  const handleExportPDF = () => {
    if (!activeSession) return;
    exportSessionAttendancePDF(activeSession, students, attendance);
  };

  const handleExportExcel = () => {
    if (!activeSession) return;
    exportSessionAttendanceToExcel(activeSession, students, attendance);
  };

  const handleExportCSV = () => {
    if (!activeSession) return;
    exportSessionAttendanceCSV(activeSession, students, attendance);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await removeSession(sessionId);
    setDeleteConfirmId(null);
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Sessions & Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Log extra classes and mark attendance by tap or QR badge scan
          </p>
        </div>

        <button
          onClick={onOpenSessionModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log New Session
        </button>
      </div>

      {/* Main Grid: Session Selector on Left / Register on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject or teacher..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Levels</option>
              {ALL_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Sessions Scrollable List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                No sessions match criteria.
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = activeSession?.id === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm leading-tight">
                            {session.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              isSelected
                                ? 'bg-slate-800 text-amber-400'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {session.level}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {formatDate(session.date)} • {session.teacher || 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          {session.attendanceRate}%
                        </span>
                        <p
                          className={`text-[10px] ${
                            isSelected ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {session.presentCount}/{session.eligibleStudentCount} Present
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Attendance Panel for Active Session (7 cols) */}
        <div className="lg:col-span-7">
          {!activeSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No Session Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Select a session from the list or log a new extra class above.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Session Header Card */}
              <div className="p-5 bg-slate-900 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-amber-400 text-slate-900">
                        {activeSession.level}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(activeSession.date)}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {activeSession.subject}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Teacher: {activeSession.teacher || 'Unassigned'}
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigateToScan(activeSession.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                      title="Open camera to scan badges for this session"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan Badges
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                      title="Export official attendance sheet to Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      title="Export official attendance sheet to PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(activeSession.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics ribbon */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
                  <div className="bg-slate-800/80 rounded-xl p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Enrolled</p>
                    <p className="text-base font-bold text-white">{eligibleStudents.length}</p>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-2">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Present</p>
                    <p className="text-base font-bold text-emerald-400">{activeSession.presentCount}</p>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Rate</p>
                    <p className="text-base font-bold text-amber-400">{activeSession.attendanceRate}%</p>
                  </div>
                </div>
              </div>

              {/* Bulk Quick Actions */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tap to Mark Attendance
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAll(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => handleMarkAll(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Student Attendance Register List */}
              <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                {eligibleStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No students are currently enrolled in {activeSession.level}.
                  </div>
                ) : (
                  eligibleStudents.map((student, idx) => {
                    const mark = currentMarksMap.get(student.id);
                    const isMarked = mark !== undefined;
                    const isPresent = mark === true;

                    return (
                      <div
                        key={student.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          !isMarked
                            ? 'bg-white border-slate-200 hover:border-slate-300'
                            : isPresent
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 w-5">
                            {idx + 1}.
                          </span>
                          <div>
                            <p className="font-bold text-sm text-slate-900 leading-tight">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {student.id}
                              {student.phone ? ` • ${student.phone}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Large Touch-friendly Toggle Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              playChime('present');
                              markAttendance(activeSession.id, student.id, true);
                            }}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                              isMarked && isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playChime('absent');
                              markAttendance(activeSession.id, student.id, false);
                            }}
                            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                              isMarked && !isPresent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Session Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Delete Tutoring Session?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will permanently delete this session and all its marked attendance records.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
