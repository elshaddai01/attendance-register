/**
 * PaymentsScreen: Fee collections ledger and payment recording
 * All amounts formatted in CFA Francs (XAF) with thousands separators.
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCFA, formatDate } from '../lib/formatters';
import { exportPaymentsCSV } from '../lib/exportUtils';
import { exportPaymentsToExcel } from '../lib/excelUtils';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Receipt,
  UserCheck,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

interface PaymentsScreenProps {
  onOpenPaymentModal: (studentId?: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  onOpenPaymentModal,
  onSelectStudent,
}) => {
  const { payments, students, removePayment, totalFeesOutstanding } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Map students for quick join
  const studentMap = useMemo(() => {
    const map = new Map<string, (typeof students)[0]>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Total collected
  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (termFilter !== 'ALL' && payment.term !== termFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = studentMap.get(payment.studentId);
        const nameMatch = student?.name.toLowerCase().includes(q) || false;
        const noteMatch = (payment.note || '').toLowerCase().includes(q);
        const recordedMatch = (payment.recordedBy || '').toLowerCase().includes(q);
        return nameMatch || noteMatch || recordedMatch;
      }
      return true;
    });
  }, [payments, termFilter, searchQuery, studentMap]);

  const handleExportCSV = () => {
    exportPaymentsCSV(payments, students);
  };

  const handleExportExcel = () => {
    exportPaymentsToExcel(payments, students);
  };

  const handleDeletePayment = async (paymentId: string) => {
    await removePayment(paymentId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Fee Payments Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Append-only financial audit log • Live balance calculations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition-colors"
            title="Export payments ledger to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Export Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => onOpenPaymentModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Financial Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Fees Collected
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2 truncate">
            {formatCFA(totalCollected)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{payments.length} transactions recorded</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Outstanding Balances
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 truncate">
            {formatCFA(totalFeesOutstanding)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending student balances</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Academic Term
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Term 1
          </p>
          <p className="text-xs text-slate-500 mt-1">2026–2027 Academic Year</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or payment note..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="sm:w-44">
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
          >
            <option value="ALL">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No payment records match criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4 hidden md:table-cell">Note / Method</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Recorded By</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.map((payment) => {
                  const student = studentMap.get(payment.studentId);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-600">
                        {formatDate(payment.date)}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {student ? (
                          <div
                            onClick={() => onSelectStudent(student.id)}
                            className="cursor-pointer"
                          >
                            <span className="font-bold text-slate-900 hover:text-blue-600">
                              {student.name}
                            </span>
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                              {student.level}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">
                            {payment.studentId}
                          </span>
                        )}
                      </td>

                      {/* Term */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                          {payment.term}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-extrabold text-sm ${
                            payment.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {formatCFA(payment.amount)}
                        </span>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-600 max-w-xs truncate">
                        {payment.note || '—'}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap text-xs text-slate-500">
                        {payment.recordedBy || 'Staff'}
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteConfirmId(payment.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete payment record (updates balance immediately)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Delete Payment Entry?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will remove the transaction from the audit ledger and revert the student's live balance immediately.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePayment(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
