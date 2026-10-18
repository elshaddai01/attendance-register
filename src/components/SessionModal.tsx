/**
 * SessionModal: Log a new Tutoring Session
 */
import React, { useState } from 'react';
import { Session, StudentLevel, ALL_LEVELS, COMMON_SUBJECTS } from '../types';
import { X, Calendar } from 'lucide-react';
import { getTodayDateString } from '../lib/formatters';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Session, 'id' | 'createdAt'>) => Promise<string>;
  defaultTeacher?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTeacher = '',
  onSessionCreated,
}) => {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [level, setLevel] = useState<StudentLevel>('Form 5');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [teacher, setTeacher] = useState<string>(defaultTeacher || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject;
    if (!finalSubject) {
      setError('Subject is required.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sessionId = await onSubmit({
        date,
        level,
        subject: finalSubject,
        teacher: teacher.trim() || 'Staff',
      });
      if (onSessionCreated) {
        onSessionCreated(sessionId);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to log session.');
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
            <h3 className="text-lg font-bold">Log Tutoring Session</h3>
            <p className="text-xs text-slate-300">
              Extra classes session register
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Session Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Target Class Level *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as StudentLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm bg-white"
            >
              {ALL_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Eligible attendance will list all enrolled students at this level.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Subject *
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm bg-white mb-2"
            >
              {COMMON_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="Other">Other / Autre...</option>
            </select>

            {subject === 'Other' && (
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter subject name..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Teacher Name
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g. Mr. Tabi Stephen"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm"
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
              <Calendar className="w-4 h-4" />
              {loading ? 'Creating...' : 'Log & Open Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
