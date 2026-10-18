/**
 * StudentBadge Component
 * Exact implementation of the official ACADÉMIE THE BEST card format:
 * - 54 x 86 mm (portrait) • Photo + QR code
 * - Switchable RECTO and VERSO views (with 3D flip effect)
 * - Category color bands (1er cycle, 2nd cycle, enseignant, administration)
 * - Direct photo upload & info edit trigger
 * - High-resolution canvas PNG export
 */
import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { AcademyLogo } from './AcademyLogo';
import {
  BADGE_CYCLES,
  SCHOOL_INFO,
  parseStudentNames,
  getFormattedMatricule,
  getFormattedClass,
  getDefaultCycleForLevel,
  renderBadgeRectoCanvas,
  renderBadgeVersoCanvas,
} from '../lib/badgeUtils';
import { Download, Camera, Edit3, RotateCw, Check } from 'lucide-react';

interface StudentBadgeProps {
  student: Student;
  index?: number;
  showActions?: boolean;
  onEditBadge?: (student: Student) => void;
  defaultSide?: 'recto' | 'verso';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const StudentBadge: React.FC<StudentBadgeProps> = ({
  student,
  index = 0,
  showActions = true,
  onEditBadge,
  defaultSide = 'recto',
  isSelected,
  onToggleSelect,
}) => {
  const [currentSide, setCurrentSide] = useState<'recto' | 'verso'>(defaultSide);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const cycle = student.cycle || getDefaultCycleForLevel(student.level);
  const theme = BADGE_CYCLES[cycle] || BADGE_CYCLES['1er CYCLE'];
  const { lastName, firstName } = parseStudentNames(student);
  const matricule = getFormattedMatricule(student, index);
  const academicYear = student.academicYear || SCHOOL_INFO.academicYear;
  const className = getFormattedClass(student);

  useEffect(() => {
    setCurrentSide(defaultSide);
  }, [defaultSide]);

  useEffect(() => {
    const payload = `XCLS1:${student.id}`;
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [student.id]);

  const handleDownloadPNG = async (side: 'recto' | 'verso' | 'both') => {
    setIsExporting(true);
    try {
      const safeName = student.name.replace(/\s+/g, '_');
      if (side === 'recto' || side === 'both') {
        const rectoCanvas = await renderBadgeRectoCanvas(student, index);
        const link = document.createElement('a');
        link.download = `badge_${matricule}_${safeName}_RECTO.png`;
        link.href = rectoCanvas.toDataURL('image/png');
        link.click();
      }
      if (side === 'verso' || side === 'both') {
        const versoCanvas = await renderBadgeVersoCanvas(student, index);
        const link = document.createElement('a');
        link.download = `badge_${matricule}_${safeName}_VERSO.png`;
        link.href = versoCanvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center group/card">
      {/* Top Card Controls (Selection & Flip) */}
      <div className="w-[264px] flex items-center justify-between mb-2 px-1 print:hidden">
        {onToggleSelect !== undefined && (
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300"
            />
            <span>Select</span>
          </label>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setCurrentSide(currentSide === 'recto' ? 'verso' : 'recto')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            title="Flip Badge Side"
          >
            <RotateCw className="w-3 h-3 text-slate-500" />
            <span className="uppercase">{currentSide === 'recto' ? 'Verso' : 'Recto'}</span>
          </button>

          {onEditBadge && (
            <button
              type="button"
              onClick={() => onEditBadge(student)}
              className="p-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
              title="Edit Badge Details & Photo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Physical Badge Card (54 x 86 mm aspect ratio) */}
      <div
        className={`relative w-[264px] h-[420px] rounded-2xl overflow-hidden bg-white border border-slate-300 shadow-md transition-all duration-300 print:shadow-none print:border-slate-800 ${
          isSelected ? 'ring-2 ring-amber-500 shadow-lg' : ''
        }`}
      >
        {/* ========================================================= */}
        {/* RECTO (FRONT) */}
        {/* ========================================================= */}
        {currentSide === 'recto' && (
          <div className="w-full h-full flex flex-col justify-between bg-white relative">
            {/* Marine Wavy Header */}
            <div className="relative bg-[#0b1a3d] text-white pt-2.5 pb-7 px-3 overflow-hidden shrink-0">
              {/* Subtle grid pattern background */}
              <div
                className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:14px_14px]"
                aria-hidden="true"
              />

              {/* Header content: Logo + Title */}
              <div className="relative z-10 flex items-center gap-2">
                <AcademyLogo size={40} className="drop-shadow-xs" />
                <div className="leading-tight">
                  <div className="flex items-center gap-1 font-bold text-[12px] tracking-wider uppercase">
                    <span className="text-white">ACADÉMIE</span>
                    <span className="text-orange-500 font-extrabold">THE BEST</span>
                  </div>
                  <p className="text-[8.5px] italic text-slate-300 font-medium">
                    {SCHOOL_INFO.tagline}
                  </p>
                </div>
              </div>

              {/* Bottom wavy curve overlay */}
              <svg
                viewBox="0 0 264 24"
                className="absolute -bottom-0.5 left-0 w-full text-white fill-current pointer-events-none"
                preserveAspectRatio="none"
              >
                <path d="M 0,16 Q 132,0 264,16 L 264,24 L 0,24 Z" />
              </svg>
            </div>

            {/* Overlapping Photo Frame */}
            <div className="relative -mt-6 self-center z-10">
              <div className="relative w-[96px] h-[116px] bg-white p-1 rounded-2xl shadow-md border-2 border-white group/photo">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Clean silhouette placeholder matching the user mockup */
                    <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center relative">
                      <div className="w-9 h-9 rounded-full bg-slate-400 mb-1" />
                      <div className="w-16 h-8 rounded-t-full bg-slate-400" />
                    </div>
                  )}
                </div>

                {/* Edit Photo Hover Overlay */}
                {onEditBadge && (
                  <button
                    type="button"
                    onClick={() => onEditBadge(student)}
                    className="absolute inset-1 rounded-xl bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity print:hidden"
                    title="Change Photo"
                  >
                    <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
                    <span className="text-[9px] font-bold">Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Pill Badge */}
            <div className="mt-1 flex justify-center">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wide text-white shadow-2xs"
                style={{ backgroundColor: theme.pillBg }}
              >
                {theme.label}
              </span>
            </div>

            {/* Student Name */}
            <div className="text-center px-2 mt-0.5">
              <h4 className="font-black text-slate-950 text-[15px] uppercase tracking-tight leading-tight truncate">
                {lastName || 'ÉTUDIANT'}
              </h4>
              {firstName && (
                <p className="text-[11.5px] font-medium text-slate-700 leading-tight truncate">
                  {firstName}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                Classe : {className}
              </p>
            </div>

            {/* Centered QR Code */}
            <div className="my-1 flex justify-center">
              <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${student.name}`}
                    className="w-[84px] h-[84px] object-contain"
                  />
                ) : (
                  <div className="w-[84px] h-[84px] bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>

            {/* Bottom Category Banner: N° TBA-2026-0001 • 2026-2027 */}
            <div
              className="w-full py-1.5 px-2 text-center text-white shrink-0 mt-auto"
              style={{ backgroundColor: theme.bannerBg }}
            >
              <p className="text-[10.5px] font-extrabold font-mono tracking-tight leading-none text-white">
                N° {matricule} • {academicYear}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VERSO (BACK) */}
        {/* ========================================================= */}
        {currentSide === 'verso' && (
          <div className="w-full h-full flex flex-col justify-between bg-white relative">
            {/* Top Accent Arched Band */}
            <div
              className="h-3 w-full shrink-0"
              style={{ backgroundColor: theme.primary }}
            />

            {/* Central Crest & School Name */}
            <div className="flex flex-col items-center pt-2 px-3 text-center">
              <AcademyLogo size={52} className="drop-shadow-xs mb-1" />
              <div className="flex items-center gap-1 font-bold text-[12px] uppercase">
                <span className="text-slate-900">ACADÉMIE</span>
                <span className="text-orange-500 font-extrabold">THE BEST</span>
              </div>
              <p className="text-[8.5px] italic text-amber-700 font-medium">
                {SCHOOL_INFO.tagline}
              </p>
            </div>

            {/* Usage Rules with Orange Dots */}
            <div className="px-3.5 space-y-1 text-[8.5px] text-slate-700 leading-tight">
              {SCHOOL_INFO.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            {/* Lost Badge Notice Box (Dashed border) */}
            <div className="mx-3 p-1.5 rounded-lg border-2 border-dashed border-orange-400 bg-orange-50/70 text-center">
              <p className="text-[9px] font-extrabold text-orange-600">
                {SCHOOL_INFO.lostNoticeTitle}
              </p>
              <p className="text-[7.5px] text-slate-600 font-medium leading-none my-0.5">
                {SCHOOL_INFO.lostNoticeBody}
              </p>
              <p className="text-[8.5px] font-bold text-slate-900 leading-tight">
                {SCHOOL_INFO.lostNoticeAddress}
              </p>
            </div>

            {/* Signatures Section */}
            <div className="px-3 grid grid-cols-2 gap-2 text-center text-[8px] text-slate-600 my-1">
              <div>
                <p className="font-bold">Signature du titulaire</p>
                <div className="h-6 border-b border-slate-300 mt-1" />
              </div>
              <div>
                <p className="font-bold">Cachet / Direction</p>
                <div className="h-6 border border-dashed border-slate-200 rounded-full w-12 mx-auto mt-0.5" />
              </div>
            </div>

            {/* Bottom Footer Band with Contacts */}
            <div
              className="w-full py-1.5 px-2 text-center text-white shrink-0 mt-auto"
              style={{ backgroundColor: theme.bannerBg }}
            >
              <p className="text-[9.5px] font-black tracking-wide leading-none text-white">
                {SCHOOL_INFO.phones}
              </p>
              <p className="text-[7px] text-white/90 font-medium mt-0.5 tracking-tight">
                {SCHOOL_INFO.subGroup}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Card Download Actions */}
      {showActions && (
        <div className="mt-2.5 flex items-center gap-1.5 w-[264px] print:hidden">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadPNG(currentSide)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title={`Download ${currentSide.toUpperCase()} PNG`}
          >
            <Download className="w-3 h-3 text-slate-600" />
            <span>Download {currentSide === 'recto' ? 'Recto' : 'Verso'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadPNG('both')}
            className="inline-flex items-center justify-center py-1.5 px-2 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title="Download Both Recto & Verso PNGs"
          >
            Both
          </button>
        </div>
      )}
    </div>
  );
};
