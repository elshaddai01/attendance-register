/**
 * PaymentModal: Record a payment or installment against a student's fee
 */
import React, { useState, useEffect } from 'react';
import { StudentWithStats, TERMS, AcademicTerm, Payment } from '../types';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { formatCFA, getTodayDateString } from '../lib/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'createdAt'>) => Promise<string>;
  students: StudentWithStats[];
  preselectedStudentId?: string | null;
  recordedByName?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  students,
  preselectedStudentId,
  recordedByName = 'Staff',
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [term, setTerm] = useState<AcademicTerm>('Term 1');
  const [amount, setAmount] = useState<number>(10000);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedStudentId(preselectedStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [preselectedStudentId, students]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Set default amount to remaining balance if positive
  useEffect(() => {
    if (selectedStudent && selectedStudent.balance > 0) {
      setAmount(selectedStudent.balance);
    }
  }, [selectedStudentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    if (amount === 0 || isNaN(amount)) {
      setError('Payment amount cannot be zero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        studentId: selectedStudentId,
        term,
        amount: Number(amount),
        date,
        note: note.trim() || 'Fee payment',
        recordedBy: recordedByName,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold">Record Fee Payment</h3>
            <p className="text-xs text-slate-300">
              Extra classes fee collection ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.level}) — Fee: {formatCFA(s.termly_fee)} | Balance: {formatCFA(s.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Student Balance Card Preview */}
          {selectedStudent && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                <p className="text-slate-500">{selectedStudent.level} • Paid: {formatCFA(selectedStudent.totalPaid)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Live Balance</p>
                <p className={`font-bold text-sm ${selectedStudent.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatCFA(selectedStudent.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Term & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Term *
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value as AcademicTerm)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm bg-white"
              >
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm font-medium"
              />
            </div>
          </div>

          {/* Amount in FCFA */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Amount Paid (FCFA) *
              </label>
              <span className="text-xs font-bold text-slate-900">
                {formatCFA(amount || 0)}
              </span>
            </div>
            <input
              type="number"
              required
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-base font-semibold"
            />

            {/* Quick shortcuts */}
            {selectedStudent && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedStudent.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedStudent.balance)}
                    className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium"
                  >
                    Clear Full Balance ({formatCFA(selectedStudent.balance)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAmount(10000)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  10 000 FCFA
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(15000)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  15 000 FCFA
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(20000)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  20 000 FCFA
                </button>
              </div>
            )}
          </div>

          {/* Note / Reference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Payment Note / Method
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. MTN MoMo ref #9834, Orange Money, Cash Mme Ndongo"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
