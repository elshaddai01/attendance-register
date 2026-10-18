/**
 * BadgeEditModal Component
 * Allows school staff to provide lacking badge information:
 * - Student portrait photo (upload file, drag-and-drop, or live webcam snapshot)
 * - Matricule ID (e.g. TBA-2026-0001)
 * - Cycle / Category (1er cycle, 2nd cycle, enseignant, administration)
 * - Class name (e.g. 6e, Form 3, 2nde C)
 * - Name separation (Surname & First name)
 * - Academic Year
 */
import React, { useState, useEffect, useRef } from 'react';
import { Student, BadgeCycle } from '../types';
import { BADGE_CYCLES, parseStudentNames, getFormattedMatricule, getDefaultCycleForLevel } from '../lib/badgeUtils';
import { X, Camera, Upload, Trash2, Check, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';

interface BadgeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (studentId: string, updates: Partial<Student>) => Promise<void>;
  suggestedIndex?: number;
}

export const BadgeEditModal: React.FC<BadgeEditModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
  suggestedIndex = 0,
}) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [className, setClassName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [cycle, setCycle] = useState<BadgeCycle>('1er CYCLE');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isCapturingWebcam, setIsCapturingWebcam] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (student) {
      const parsed = parseStudentNames(student);
      setLastName(parsed.lastName);
      setFirstName(parsed.firstName);
      setClassName(student.className || student.level || '');
      setMatricule(getFormattedMatricule(student, suggestedIndex));
      setCycle(student.cycle || getDefaultCycleForLevel(student.level));
      setAcademicYear(student.academicYear || '2026-2027');
      setPhotoUrl(student.photoUrl || '');
      setError(null);
    }
  }, [student, suggestedIndex, isOpen]);

  // Stop camera on unmount or close
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  if (!isOpen || !student) return null;

  const handleStartWebcam = async () => {
    setError(null);
    try {
      setIsCapturingWebcam(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access webcam. Please check browser camera permissions or upload an image file.');
      setIsCapturingWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturingWebcam(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const video = videoRef.current;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPhotoUrl(dataUrl);
    stopWebcam();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 600x600 for optimal storage & high DPI badge rendering
        const canvas = document.createElement('canvas');
        const maxSide = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w > h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAutoMatricule = () => {
    const num = String(suggestedIndex + 1).padStart(4, '0');
    setMatricule(`TBA-2026-${num}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) {
      setError('Student surname (nom) is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const fullName = firstName.trim() ? `${lastName.trim()} ${firstName.trim()}` : lastName.trim();

      await onSave(student.id, {
        name: fullName,
        lastName: lastName.trim().toUpperCase(),
        firstName: firstName.trim(),
        className: className.trim() || student.level,
        matricule: matricule.trim(),
        cycle,
        academicYear: academicYear.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });

      stopWebcam();
      onClose();
    } catch (err: unknown) {
      console.error('Error saving badge info:', err);
      setError(err instanceof Error ? err.message : 'Failed to save badge details.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentTheme = BADGE_CYCLES[cycle] || BADGE_CYCLES['1er CYCLE'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Edit Badge & Portrait Photo
              </h3>
              <p className="text-xs text-slate-300">
                Official badge information for {student.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Photo Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Badge Portrait Photo
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview / Webcam Frame */}
              <div className="relative w-32 h-40 bg-slate-200 rounded-2xl border-4 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                {isCapturingWebcam ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-300 mb-2 flex items-center justify-center text-slate-500 font-bold">
                      {lastName.charAt(0) || 'S'}
                    </div>
                    <span className="text-[10px] leading-tight font-medium">No photo set</span>
                  </div>
                )}

                {photoUrl && !isCapturingWebcam && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    title="Remove Photo"
                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action buttons for photo */}
              <div className="flex-1 space-y-2.5 w-full">
                {isCapturingWebcam ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Take Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancel Camera
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      Upload Photo
                    </button>

                    <button
                      type="button"
                      onClick={handleStartWebcam}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                      Use Webcam
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Recommended: portrait crop, clear background. Fits standard 54×86mm badge.
                </p>
              </div>
            </div>
          </div>

          {/* Student Names (Surname & First Name) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Surname (Nom de famille) *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. MBARGA"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400">Displayed in prominent bold uppercase</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name (Prénom)
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jean-Paul"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400">Displayed beneath surname</span>
            </div>
          </div>

          {/* Class & Matricule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class / Classe *
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 6e, Form 3, 2nde C"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400">e.g. "Classe : 6e" on card</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Matricule (N° TBA) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoMatricule}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Auto-Gen
                </button>
              </div>
              <input
                type="text"
                required
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="TBA-2026-0001"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Category / Cycle & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Category / Color Code
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as BadgeCycle)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="1er CYCLE">1er CYCLE (Orange band • Form 1-3 / 6e-3e)</option>
                <option value="2nd CYCLE">2nd CYCLE (Blue band • Form 4-Upper 6th / 2nde-Tle)</option>
                <option value="ENSEIGNANT">ENSEIGNANT (Green band • Teacher pass)</option>
                <option value="ADMINISTRATION">ADMINISTRATION (Dark Charcoal band • Staff pass)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                stopWebcam();
                onClose();
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Badge Info
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
