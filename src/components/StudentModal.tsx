/**
 * StudentModal: Add or Edit Student
 */
import React, { useState, useEffect } from 'react';
import { Student, StudentLevel, ALL_LEVELS, COMMON_SUBJECTS } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatCFA } from '../lib/formatters';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  editingStudent?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStudent,
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<StudentLevel>('Form 5');
  const [className, setClassName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [phone, setPhone] = useState('');
  const [termlyFee, setTermlyFee] = useState<number>(30000);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setLevel(editingStudent.level);
      setClassName(editingStudent.className || '');
      setMatricule(editingStudent.matricule || '');
      setPhone(editingStudent.phone || '');
      setTermlyFee(editingStudent.termly_fee || 30000);
      setSelectedSubjects(editingStudent.subjects || []);
    } else {
      setName('');
      setLevel('Form 5');
      setClassName('');
      setMatricule('');
      setPhone('');
      setTermlyFee(30000);
      setSelectedSubjects(['Mathematics', 'Physics']);
    }
    setValidationError(null);
  }, [editingStudent, isOpen]);

  if (!isOpen) return null;

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Student name is required.');
      return;
    }
    if (termlyFee < 0) {
      setValidationError('Termly fee cannot be negative.');
      return;
    }

    setLoading(true);
    setValidationError(null);
    try {
      await onSubmit({
        name: name.trim(),
        level,
        className: className.trim() || undefined,
        matricule: matricule.trim() || undefined,
        subjects: selectedSubjects,
        phone: phone.trim(),
        termly_fee: Number(termlyFee),
      });
      onClose();
    } catch (err: unknown) {
      console.error('Enrollment error:', err);
      let errorMsg = 'Failed to enroll student. Please check network connection and try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errorMsg = `Database error: ${parsed.error}`;
          }
        } catch {
          errorMsg = err.message;
        }
      }
      setValidationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold">
              {editingStudent ? 'Edit Student' : 'Enroll New Student'}
            </h3>
            <p className="text-xs text-slate-300">
              THE BEST ACADEMY Extra Classes
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
          {validationError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jean-Paul Mbarga"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Class Level *
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
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Parent / Student Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XX XX XX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Badge Class Display (Optional)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 6e, Form 3, 2nde C"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Badge Matricule (Optional)
              </label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="e.g. TBA-2026-0001"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Termly Extra Classes Fee (FCFA) *
              </label>
              <span className="text-xs font-medium text-emerald-700">
                {formatCFA(termlyFee || 0)}
              </span>
            </div>
            <input
              type="number"
              required
              min={0}
              step={1000}
              value={termlyFee}
              onChange={(e) => setTermlyFee(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 text-sm font-medium"
            />
            <div className="flex gap-2 mt-1.5">
              {[20000, 25000, 30000, 35000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setTermlyFee(preset)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    termlyFee === preset
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatCFA(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Enrolled Subjects
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              {COMMON_SUBJECTS.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sub} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom subject input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Other subject name..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSubject();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomSubject}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
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
              className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
