/**
 * StudentDetailDrawer: Displays full profile, attendance history,
 * payments ledger, and QR badge for a single student.
 */
import React, { useState } from 'react';
import { StudentWithStats, Session, AttendanceMark, Payment } from '../types';
import { StudentBadge } from './StudentBadge';
import { formatCFA, formatDate, formatDateTime } from '../lib/formatters';
import {
  X,
  CreditCard,
  CalendarCheck,
  QrCode,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Phone,
  BookOpen,
} from 'lucide-react';

interface StudentDetailDrawerProps {
  student: StudentWithStats | null;
  onClose: () => void;
  sessions: Session[];
  attendance: AttendanceMark[];
  payments: Payment[];
  onOpenPaymentModal: (studentId: string) => void;
  onEditStudent: (student: StudentWithStats) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  student,
  onClose,
  sessions,
  attendance,
  payments,
  onOpenPaymentModal,
  onEditStudent,
  onDeleteStudent,
  onDeletePayment,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'payments' | 'badge'>('attendance');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!student) return null;

  // Payments for this student, newest first
  const studentPayments = payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  // Sessions at student's level
  const levelSessions = sessions.filter((s) => s.level === student.level);

  // Map student attendance
  const markMap = new Map<string, { present: boolean; markedAt: string; markedBy?: string }>();
  attendance
    .filter((m) => m.studentId === student.id)
    .forEach((m) => {
      markMap.set(m.sessionId, { present: m.present, markedAt: m.markedAt, markedBy: m.markedBy });
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-400 text-slate-900">
                {student.level}
              </span>
              <span className="text-xs font-mono text-slate-400">{student.id}</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">{student.name}</h2>
            {student.phone && (
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5" />
                {student.phone}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial & Attendance Summary Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-center">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-500">Termly Fee</p>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">
              {formatCFA(student.termly_fee)}
            </p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Paid</p>
            <p className="font-semibold text-emerald-600 text-sm mt-0.5">
              {formatCFA(student.totalPaid)}
            </p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-500">Live Balance</p>
            <p className={`font-bold text-sm mt-0.5 ${student.balance > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {formatCFA(student.balance)}
            </p>
          </div>
        </div>

        {/* Subjects bar */}
        {student.subjects && student.subjects.length > 0 && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-500 shrink-0">Subjects:</span>
            <div className="flex gap-1.5 flex-wrap">
              {student.subjects.map((sub) => (
                <span
                  key={sub}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[11px]"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Attendance ({student.attendedCount}/{student.totalSessionsForLevel})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payments ({studentPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'badge'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Badge
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">
                  Attendance Record for {student.level}
                </h4>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-800">
                  Rate: {student.attendanceRate}%
                </div>
              </div>

              {levelSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No sessions have been logged for {student.level} yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {levelSessions.map((session) => {
                    const mark = markMap.get(session.id);
                    const isMarked = mark !== undefined;
                    const isPresent = mark?.present === true;

                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{session.subject}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(session.date)} • Teacher: {session.teacher || 'Unassigned'}
                          </p>
                          {mark?.markedAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Marked {formatDateTime(mark.markedAt)} by {mark.markedBy || 'Staff'}
                            </p>
                          )}
                        </div>
                        <div>
                          {!isMarked ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-500">
                              Unrecorded
                            </span>
                          ) : isPresent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              Absent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">Payment History</h4>
                <button
                  onClick={() => onOpenPaymentModal(student.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              </div>

              {studentPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No payments logged yet for this student.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-emerald-700">
                            {formatCFA(payment.amount)}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                            {payment.term}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Date: {formatDate(payment.date)} • By: {payment.recordedBy || 'Staff'}
                        </p>
                        {payment.note && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">"{payment.note}"</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeletePayment(payment.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete this payment record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. BADGE TAB */}
          {activeTab === 'badge' && (
            <div className="flex flex-col items-center py-4">
              <StudentBadge student={student} showActions={true} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!showDeleteConfirm ? (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 p-2 rounded hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Student
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditStudent(student)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => onOpenPaymentModal(student.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <p className="text-xs text-rose-800 font-medium">
                Cascade delete student and all attendance/payment records?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white rounded border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteStudent(student.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 rounded hover:bg-rose-700"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
