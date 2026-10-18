/**
 * BadgesScreen Component
 * Official ACADÉMIE THE BEST ID badge issuance and printing station:
 * - 54 x 86 mm (portrait) format • Photo + QR Code
 * - Photo and lacking badge info editor (camera/file upload, matricule, cycle, class)
 * - Recto-Verso Duplex alignment for double-sided A4 printing
 * - High-res PDF download, ZIP bundle export, and browser print
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentBadge } from '../components/StudentBadge';
import { BadgeEditModal } from '../components/BadgeEditModal';
import { AcademyLogo } from '../components/AcademyLogo';
import { ALL_LEVELS, Student, BadgeCycle } from '../types';
import {
  BADGE_CYCLES,
  generateDuplexBadgesPdf,
  generateBadgesZip,
  getDefaultCycleForLevel,
  getFormattedMatricule,
} from '../lib/badgeUtils';
import {
  Printer,
  Search,
  Filter,
  QrCode,
  Download,
  Camera,
  CheckSquare,
  Square,
  RotateCw,
  FileText,
  Archive,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

export const BadgesScreen: React.FC = () => {
  const { students, editStudent } = useApp();

  // Search & Filters
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'MISSING' | 'HAS_PHOTO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // View state: 'recto' | 'verso' | 'both'
  const [viewSide, setViewSide] = useState<'recto' | 'verso' | 'both'>('recto');

  // Multi-selection for batch print/download
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Edit badge modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(0);

  // Export progress modal state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportProgressPercent, setExportProgressPercent] = useState(0);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Level filter
      if (levelFilter !== 'ALL' && s.level !== levelFilter) {
        return false;
      }
      // Cycle filter
      const studentCycle = s.cycle || getDefaultCycleForLevel(s.level);
      if (cycleFilter !== 'ALL' && studentCycle !== cycleFilter) {
        return false;
      }
      // Photo filter
      if (photoFilter === 'MISSING' && s.photoUrl) {
        return false;
      }
      if (photoFilter === 'HAS_PHOTO' && !s.photoUrl) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesMatricule = (s.matricule || '').toLowerCase().includes(q);
        return matchesName || matchesId || matchesMatricule;
      }
      return true;
    });
  }, [students, levelFilter, cycleFilter, photoFilter, searchQuery]);

  // Count missing photos
  const missingPhotoCount = useMemo(() => {
    return students.filter((s) => !s.photoUrl).length;
  }, [students]);

  // Selection handlers
  const handleSelectAll = () => {
    const next = new Set<string>();
    filteredStudents.forEach((s) => next.add(s.id));
    setSelectedStudentIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const selectedStudents = useMemo(() => {
    if (selectedStudentIds.size === 0) return filteredStudents;
    return students.filter((s) => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds, filteredStudents]);

  // Batch Auto-Matricule Assignment
  const handleAutoAssignMatricules = async () => {
    const confirmed = window.confirm(
      'Automatically assign sequential matricules (TBA-2026-0001, etc.) to all students missing one?'
    );
    if (!confirmed) return;

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.matricule) {
        const num = String(i + 1).padStart(4, '0');
        await editStudent(s.id, {
          matricule: `TBA-2026-${num}`,
          academicYear: s.academicYear || '2026-2027',
          cycle: s.cycle || getDefaultCycleForLevel(s.level),
        });
      }
    }
  };

  // Batch Duplex PDF Download
  const handleDownloadDuplexPdf = async () => {
    const targetStudents = selectedStudents.length > 0 ? selectedStudents : filteredStudents;
    if (targetStudents.length === 0) {
      alert('No students selected for badge printing.');
      return;
    }

    setIsExporting(true);
    setExportProgressPercent(0);
    setExportProgressText('Preparing Recto-Verso duplex pages...');

    try {
      const doc = await generateDuplexBadgesPdf(targetStudents, (text, pct) => {
        setExportProgressText(text);
        setExportProgressPercent(pct);
      });

      const today = new Date().toISOString().split('T')[0];
      doc.save(`BADGES_RECTO_VERSO_${targetStudents.length}_STUDENTS_${today}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate duplex PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch ZIP PNG Download
  const handleDownloadZip = async () => {
    const targetStudents = selectedStudents.length > 0 ? selectedStudents : filteredStudents;
    if (targetStudents.length === 0) {
      alert('No students selected.');
      return;
    }

    setIsExporting(true);
    setExportProgressPercent(0);
    setExportProgressText('Generating high-res PNG images for selected badges...');

    try {
      const blob = await generateBadgesZip(targetStudents, (text, pct) => {
        setExportProgressText(text);
        setExportProgressPercent(pct);
      });

      const today = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `THE_BEST_ACADEMY_BADGES_${targetStudents.length}_STUDENTS_${today}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('ZIP export failed:', err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsExporting(false);
    }
  };

  // Browser Print
  const handlePrintSheet = () => {
    window.print();
  };

  const handleOpenEdit = (student: Student) => {
    const idx = students.findIndex((s) => s.id === student.id);
    setEditingStudent(student);
    setEditingIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header (Hidden when printing) */}
      <div className="bg-gradient-to-r from-[#0b1a3d] via-[#162a56] to-[#1e3a70] rounded-3xl p-6 text-white shadow-lg print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <AcademyLogo size={64} className="drop-shadow-md shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wide text-white">
                  ACADÉMIE
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-wide text-orange-400">
                  THE BEST
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/30 text-orange-300 border border-orange-400/40">
                  Official Badge Format
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic font-medium mt-0.5">
                Leur devenir, notre priorité • Format 54 × 86 mm (portrait) • Photo + QR code
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Print in Recto-Verso duplex alignment • Automatic student portrait and matricule management
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={handleDownloadDuplexPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-all active:scale-95"
              title="Download Duplex PDF with mirrored Recto-Verso alignment"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Download Recto-Verso PDF</span>
              {selectedStudentIds.size > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-950 text-white rounded-full text-[10px]">
                  {selectedStudentIds.size}
                </span>
              )}
            </button>

            <button
              onClick={handleDownloadZip}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xs transition-colors"
              title="Download high-resolution PNG images in a ZIP file"
            >
              <Archive className="w-4 h-4" />
              <span>ZIP (PNGs)</span>
            </button>

            <button
              onClick={handlePrintSheet}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Print directly using browser print dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Category Colors Reference Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-300 uppercase text-[11px] tracking-wider">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>Codes Couleur par Catégorie :</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-600/30 text-orange-300 border border-orange-500/50 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              1er cycle (Orange)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              2nd cycle (Bleu)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Enseignant (Vert)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-600/30 text-slate-300 border border-slate-500/50 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Administration (Gris)
            </span>
          </div>
        </div>
      </div>

      {/* Missing Photo Alert / Callout */}
      {missingPhotoCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {missingPhotoCount} {missingPhotoCount === 1 ? 'student is' : 'students are'} missing a badge portrait photo
              </h4>
              <p className="text-xs text-amber-700">
                Click on any student card or badge photo to take a webcam snapshot or upload a photo directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhotoFilter(photoFilter === 'MISSING' ? 'ALL' : 'MISSING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                photoFilter === 'MISSING'
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
              }`}
            >
              {photoFilter === 'MISSING' ? 'Show All Students' : 'Filter Missing Photos'}
            </button>
            <button
              onClick={handleAutoAssignMatricules}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              Auto-Assign Matricules
            </button>
          </div>
        </div>
      )}

      {/* Toolbar & Filters (Hidden when printing) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or matricule..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Levels ({students.length})</option>
              {ALL_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Category / Cycle Filter */}
          <div>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Categories</option>
              <option value="1er CYCLE">1er CYCLE (Orange)</option>
              <option value="2nd CYCLE">2nd CYCLE (Blue)</option>
              <option value="ENSEIGNANT">ENSEIGNANT (Green)</option>
              <option value="ADMINISTRATION">ADMINISTRATION (Slate)</option>
            </select>
          </div>

          {/* Photo Status Filter */}
          <div>
            <select
              value={photoFilter}
              onChange={(e) => setPhotoFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Photos</option>
              <option value="MISSING">Missing Photo ({missingPhotoCount})</option>
              <option value="HAS_PHOTO">Has Photo ({students.length - missingPhotoCount})</option>
            </select>
          </div>
        </div>

        {/* Row 2: Selection & View Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Multi-Selection Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All ({filteredStudents.length})</span>
            </button>

            {selectedStudentIds.size > 0 && (
              <button
                onClick={handleDeselectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </button>
            )}

            <span className="font-semibold text-slate-600 ml-2">
              {selectedStudentIds.size} of {filteredStudents.length} selected
            </span>
          </div>

          {/* View Mode Switcher (Recto / Verso / Both) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewSide('recto')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                viewSide === 'recto'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recto (Front)
            </button>
            <button
              onClick={() => setViewSide('verso')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                viewSide === 'verso'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verso (Back)
            </button>
            <button
              onClick={() => setViewSide('both')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                viewSide === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Sides
            </button>
          </div>
        </div>
      </div>

      {/* Badges Grid (Interactive & Print-Friendly) */}
      {filteredStudents.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 print:hidden">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No student badges match your filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, level filter, or photo filter above.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-6 justify-center ${
            viewSide === 'both'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          } print:grid-cols-2 print:gap-4 print:p-0`}
        >
          {filteredStudents.map((student, idx) => {
            const isSelected = selectedStudentIds.has(student.id);

            return (
              <div
                key={student.id}
                className="flex justify-center print:break-inside-avoid print:page-break-inside-avoid"
              >
                {viewSide === 'both' ? (
                  /* Side-by-side Recto + Verso representation */
                  <div className="bg-slate-50/70 p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-4 items-center">
                    <StudentBadge
                      student={student}
                      index={idx}
                      defaultSide="recto"
                      showActions={false}
                      isSelected={isSelected}
                      onToggleSelect={() => handleToggleSelect(student.id)}
                      onEditBadge={handleOpenEdit}
                    />
                    <StudentBadge
                      student={student}
                      index={idx}
                      defaultSide="verso"
                      showActions={true}
                      isSelected={isSelected}
                      onEditBadge={handleOpenEdit}
                    />
                  </div>
                ) : (
                  <StudentBadge
                    student={student}
                    index={idx}
                    defaultSide={viewSide}
                    showActions={true}
                    isSelected={isSelected}
                    onToggleSelect={() => handleToggleSelect(student.id)}
                    onEditBadge={handleOpenEdit}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Badge & Photo Modal */}
      <BadgeEditModal
        isOpen={Boolean(editingStudent)}
        student={editingStudent}
        suggestedIndex={editingIndex}
        onClose={() => setEditingStudent(null)}
        onSave={async (id, updates) => {
          await editStudent(id, updates);
        }}
      />

      {/* Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <RotateCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generating Recto-Verso Badges
              </h3>
              <p className="text-xs text-slate-500 mt-1">{exportProgressText}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${exportProgressPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-mono font-bold text-slate-600">
              {exportProgressPercent}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
