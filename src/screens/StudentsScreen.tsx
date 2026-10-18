/**
 * StudentsScreen
 * Searchable, filterable roster table with live balances,
 * level filters, payment status filters, and export.
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentWithStats, StudentLevel, ALL_LEVELS } from '../types';
import { formatCFA } from '../lib/formatters';
import { exportStudentsToExcel, downloadExcelTemplate } from '../lib/excelUtils';
import { exportStudentsRosterCSV } from '../lib/exportUtils';
import {
  Search,
  Plus,
  Filter,
  Download,
  CreditCard,
  QrCode,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

interface StudentsScreenProps {
  onOpenEnrollModal: () => void;
  onOpenImportModal: () => void;
  onEditStudent: (student: StudentWithStats) => void;
  onSelectStudent: (studentId: string) => void;
  onOpenPaymentModal: (studentId: string) => void;
}

export const StudentsScreen: React.FC<StudentsScreenProps> = ({
  onOpenEnrollModal,
  onOpenImportModal,
  onEditStudent,
  onSelectStudent,
  onOpenPaymentModal,
}) => {
  const { studentsWithStats, payments, sessions, attendance, removeStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered and searched students
  const filteredStudents = useMemo(() => {
    return studentsWithStats.filter((student) => {
      // 1. Level filter
      if (selectedLevel !== 'ALL' && student.level !== selectedLevel) {
        return false;
      }
      // 2. Payment status filter
      if (paymentFilter === 'DUE' && student.balance <= 0) {
        return false;
      }
      if (paymentFilter === 'PAID' && student.balance > 0) {
        return false;
      }
      // 3. Search query (name, phone, subjects, ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesPhone = (student.phone || '').toLowerCase().includes(query);
        const matchesId = student.id.toLowerCase().includes(query);
        const matchesSubject = (student.subjects || []).some((s) =>
          s.toLowerCase().includes(query)
        );
        return matchesName || matchesPhone || matchesId || matchesSubject;
      }
      return true;
    });
  }, [studentsWithStats, selectedLevel, paymentFilter, searchQuery]);

  const handleExportExcel = () => {
    exportStudentsToExcel(studentsWithStats, payments, sessions, attendance);
  };

  const handleConfirmDelete = async (studentId: string) => {
    await removeStudent(studentId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {filteredStudents.length} enrolled {filteredStudents.length === 1 ? 'student' : 'students'} • Live fee balance tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Download */}
          <button
            onClick={downloadExcelTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Download blank Excel spreadsheet template with instructions"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Template (.xlsx)
          </button>

          {/* Import Excel */}
          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Import student roster from Excel spreadsheet"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Import Excel
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition-colors"
            title="Export student roster & level breakdown to formatted Excel file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Export Excel
          </button>

          {/* Enroll Student */}
          <button
            onClick={onOpenEnrollModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, phone, or subject..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="sm:w-48">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ALL">All Levels (Toutes classes)</option>
              {ALL_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter Buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setPaymentFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                paymentFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPaymentFilter('DUE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                paymentFilter === 'DUE'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balance Due
            </button>
            <button
              onClick={() => setPaymentFilter('PAID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                paymentFilter === 'PAID'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fully Paid
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4 hidden md:table-cell">Subjects</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Phone</th>
                  <th className="py-3 px-4">Termly Fee</th>
                  <th className="py-3 px-4">Live Balance</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Attendance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => {
                  const hasBalance = student.balance > 0;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onSelectStudent(student.id)}
                          className="cursor-pointer"
                        >
                          <p className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {student.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {student.id}
                          </p>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-800">
                          {student.level}
                        </span>
                      </td>

                      {/* Subjects */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(student.subjects || []).slice(0, 3).map((sub) => (
                            <span
                              key={sub}
                              className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded"
                            >
                              {sub}
                            </span>
                          ))}
                          {(student.subjects || []).length > 3 && (
                            <span className="text-[11px] text-slate-400 self-center">
                              +{student.subjects.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600 text-xs whitespace-nowrap">
                        {student.phone ? (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Termly Fee */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                        {formatCFA(student.termly_fee)}
                      </td>

                      {/* Live Balance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasBalance ? (
                          <div className="flex flex-col">
                            <span className="font-extrabold text-amber-600 text-xs sm:text-sm">
                              {formatCFA(student.balance)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Paid: {formatCFA(student.totalPaid)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid in Full
                          </span>
                        )}
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${student.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {student.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({student.attendedCount}/{student.totalSessionsForLevel})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenPaymentModal(student.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View QR Badge & History"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(student.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cascading Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Delete Student Record?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will permanently delete the student and cascade delete all their session attendance marks and payment records.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteTargetId)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Cascade Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
