/**
 * ScanScreen: QR Attendance Scanner & Manual Lookup
 * Optimized for one-handed classroom use on mobile (>= 360px wide).
 * Uses native camera capture input + jsQR for rapid sub-3-second decoding.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import jsQR from 'jsqr';
import { useApp } from '../context/AppContext';
import { StudentWithStats, Session } from '../types';
import { extractStudentIdFromQR, formatCFA, playChime, formatDate } from '../lib/formatters';
import {
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Calendar,
  Volume2,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface ScanScreenProps {
  initialSessionId?: string | null;
  onOpenSessionModal: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  initialSessionId,
  onOpenSessionModal,
}) => {
  const {
    sessions,
    studentsWithStats,
    attendance,
    markAttendance,
    currentStaffName,
  } = useApp();

  // Active session selector
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (initialSessionId && sessions.some((s) => s.id === initialSessionId)) {
      return initialSessionId;
    }
    return sessions.length > 0 ? sessions[0].id : '';
  });

  // Keep synced if sessions load later
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // Scanned / Selected Student state
  const [matchedStudent, setMatchedStudent] = useState<StudentWithStats | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'processing' | 'success' | 'not_found' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastMarkedStatus, setLastMarkedStatus] = useState<{ studentName: string; present: boolean } | null>(null);

  // Manual fallback search
  const [manualQuery, setManualQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live session attendance lookup for the selected student
  const activeStudentMark = useMemo(() => {
    if (!matchedStudent || !activeSession) return null;
    return attendance.find(
      (m) => m.sessionId === activeSession.id && m.studentId === matchedStudent.id
    );
  }, [matchedStudent, activeSession, attendance]);

  // Recent scans in this session
  const recentScansInSession = useMemo(() => {
    if (!activeSession) return [];
    return attendance
      .filter((m) => m.sessionId === activeSession.id)
      .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())
      .slice(0, 5)
      .map((mark) => {
        const student = studentsWithStats.find((s) => s.id === mark.studentId);
        return {
          mark,
          student,
        };
      });
  }, [attendance, activeSession, studentsWithStats]);

  // DECODE PHOTO WITH JSQR
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('processing');
    setStatusMessage('Decoding badge...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Scale to max 1000px dimension for rapid decode without sacrificing quality
          const maxDim = 1000;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setScanStatus('invalid');
            setStatusMessage('Could not process camera image.');
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);

          // Run jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            processDecodedCode(code.data);
          } else {
            setScanStatus('not_found');
            setStatusMessage(
              'No QR badge detected. Ensure the student badge is centered, well-lit, and in focus.'
            );
          }
        } catch (err) {
          console.error('QR decode error:', err);
          setScanStatus('invalid');
          setStatusMessage('Failed to decode badge photo.');
        } finally {
          // Reset file input so user can take another photo of the same student
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processDecodedCode = (decodedString: string) => {
    const studentId = extractStudentIdFromQR(decodedString);
    if (!studentId) {
      setScanStatus('invalid');
      setStatusMessage(`Unrecognized QR code format: "${decodedString}".`);
      return;
    }

    const found = studentsWithStats.find((s) => s.id === studentId);
    if (found) {
      playChime('scan');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(60);
      }
      setMatchedStudent(found);
      setScanStatus('success');
      setStatusMessage(`Identified: ${found.name}`);
    } else {
      setScanStatus('not_found');
      setStatusMessage(`Student ID "${studentId}" not found in current roster.`);
      setMatchedStudent(null);
    }
  };

  const handleMark = async (present: boolean) => {
    if (!activeSession || !matchedStudent) return;
    playChime(present ? 'present' : 'absent');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(present ? [40, 40, 80] : [80]);
    }
    await markAttendance(activeSession.id, matchedStudent.id, present);
    setLastMarkedStatus({
      studentName: matchedStudent.name,
      present,
    });
  };

  // Manual student select
  const filteredManualStudents = useMemo(() => {
    if (!manualQuery.trim()) return [];
    const q = manualQuery.toLowerCase().trim();
    return studentsWithStats
      .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      .slice(0, 6);
  }, [studentsWithStats, manualQuery]);

  const selectManualStudent = (student: StudentWithStats) => {
    setMatchedStudent(student);
    setScanStatus('success');
    setStatusMessage(`Selected: ${student.name}`);
    setManualQuery('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* Hidden File Input for Native Camera Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
      />

      {/* STICKY ACTIVE SESSION SELECTOR */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-2 sticky top-2 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            Active Session
          </div>
          <button
            onClick={onOpenSessionModal}
            className="text-[11px] text-slate-300 hover:text-white underline"
          >
            + New Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-2 text-center text-xs text-slate-400 bg-slate-800 rounded-xl">
            No sessions available.{' '}
            <button onClick={onOpenSessionModal} className="text-amber-400 underline font-semibold">
              Create one first
            </button>
          </div>
        ) : (
          <select
            value={activeSessionId}
            onChange={(e) => {
              setActiveSessionId(e.target.value);
              setLastMarkedStatus(null);
            }}
            className="w-full bg-slate-800 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.level} • {s.subject} ({formatDate(s.date)}) — {s.teacher || 'Teacher'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* PRIMARY SCAN CAMERA BUTTON (Thumb-friendly 60px target) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeSession}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-extrabold text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          <Camera className="w-6 h-6 stroke-[2.5]" />
          <span>TAP TO SCAN QR BADGE</span>
        </button>

        <p className="text-[11px] text-slate-500">
          Opens phone camera to snapshot student's printed badge
        </p>

        {/* Status Messages */}
        {scanStatus === 'processing' && (
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
            {statusMessage}
          </div>
        )}

        {scanStatus === 'not_found' && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Badge Not Detected</p>
              <p className="text-[11px] text-amber-800 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {scanStatus === 'invalid' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs text-left flex gap-2.5">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Invalid QR Code</p>
              <p className="text-[11px] text-rose-800 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT MATCHED CARD & ONE-TAP ATTENDANCE MARKING */}
      {matchedStudent && activeSession && (
        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top Banner */}
          <div className="bg-slate-900 text-white p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-400 text-slate-900">
                  {matchedStudent.level}
                </span>
                <span className="text-xs font-mono text-slate-400">{matchedStudent.id}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {matchedStudent.name}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Balance</span>
              <p
                className={`font-extrabold text-sm ${
                  matchedStudent.balance > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {formatCFA(matchedStudent.balance)}
              </p>
            </div>
          </div>

          {/* Eligibility alert if level mismatch */}
          {matchedStudent.level !== activeSession.level && (
            <div className="p-2.5 bg-amber-100 text-amber-900 text-xs font-medium flex items-center gap-2 border-b border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Note: Student level ({matchedStudent.level}) differs from active session level ({activeSession.level}).
              </span>
            </div>
          )}

          {/* Current Attendance State for this Session */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Current Status for {activeSession.subject}
            </p>
            {!activeStudentMark ? (
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                Not Marked Yet
              </span>
            ) : activeStudentMark.present ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                MARKED PRESENT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                <XCircle className="w-4 h-4 text-rose-600" />
                MARKED ABSENT
              </span>
            )}
          </div>

          {/* LARGE TOUCH ATTENDANCE BUTTONS */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleMark(true)}
              className={`py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                activeStudentMark?.present
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              MARK PRESENT
            </button>

            <button
              type="button"
              onClick={() => handleMark(false)}
              className={`py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                activeStudentMark && activeStudentMark.present === false
                  ? 'bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2'
                  : 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700'
              }`}
            >
              <XCircle className="w-5 h-5 stroke-[2.5]" />
              MARK ABSENT
            </button>
          </div>

          {/* Scan Next Prompt */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Done with this student?</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1"
            >
              Scan Next Badge <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MANUAL SEARCH FALLBACK */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Manual Name Search Fallback
          </label>
          <span className="text-[10px] text-slate-400">If badge is damaged</span>
        </div>

        <input
          type="text"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          placeholder="Type student name to mark..."
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        />

        {filteredManualStudents.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100 max-h-48 overflow-y-auto">
            {filteredManualStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => selectManualStudent(s)}
                className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.level} • {s.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {formatCFA(s.balance)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT SCANS LOG IN THIS SESSION */}
      {recentScansInSession.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recently Recorded in This Session
          </p>
          <div className="space-y-1.5">
            {recentScansInSession.map(({ mark, student }) => (
              <div
                key={mark.id}
                onClick={() => student && setMatchedStudent(student)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {student ? student.name : mark.studentId}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {student?.level} • Recorded {new Date(mark.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  {mark.present ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Present
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      Absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
