/**
 * Header & Navigation Component
 * Includes school branding, active staff profile switcher,
 * live Firestore sync indicator, and responsive desktop/mobile navigation.
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AcademyLogo } from './AcademyLogo';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  QrCode,
  Printer,
  User,
  LogOut,
  LogIn,
  Radio,
  Sparkles,
  Check,
  Edit3,
  Shield,
} from 'lucide-react';

export type ScreenType = 'overview' | 'students' | 'sessions' | 'payments' | 'scan' | 'badges';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenStaffAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, onOpenStaffAdmin }) => {
  const {
    user,
    authLoading,
    signInWithGoogle,
    signOutUser,
    currentStaffName,
    setCurrentStaffName,
    connectionOnline,
  } = useApp();

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [tempStaffName, setTempStaffName] = useState(currentStaffName);

  const navItems: { id: ScreenType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: CalendarDays },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'scan', label: 'Scan', icon: QrCode },
    { id: 'badges', label: 'Badges', icon: Printer },
  ];

  const handleSaveStaffName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempStaffName.trim()) {
      setCurrentStaffName(tempStaffName.trim());
      setShowStaffModal(false);
    }
  };

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* School Logo & Title */}
            <div
              onClick={() => onNavigate('overview')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <AcademyLogo size={40} className="drop-shadow-sm" />
              <div>
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    ACADÉMIE
                  </span>
                  <span className="font-black text-sm sm:text-base tracking-tight text-orange-400">
                    THE BEST
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-amber-400">Extra Classes Register</p>
                  <span className="text-slate-600">•</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400">Live Sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-slate-800 text-amber-400 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Staff Switcher & Auth */}
            <div className="flex items-center gap-2.5">
              {/* Staff Switcher Chip */}
              <button
                onClick={() => {
                  setTempStaffName(currentStaffName);
                  setShowStaffModal(true);
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                title="Change active staff/teacher name for session records"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">
                  {currentStaffName}
                </span>
                <Edit3 className="w-3 h-3 text-slate-400" />
              </button>

              {/* Security & Staff Panel */}
              {onOpenStaffAdmin && user && (
                <button
                  onClick={onOpenStaffAdmin}
                  className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Staff Access & Security Panel"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}

              {/* Google Sign In / User Profile */}
              {user ? (
                <button
                  onClick={signOutUser}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  title={`Signed in as ${user.email} • Click to sign out`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Secondary Bar */}
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 overflow-x-auto px-2 py-1.5 flex gap-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Staff Name Switcher Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Active Staff / Teacher Name
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              This name is stamped on attendance marks and payment records logged during this session.
            </p>

            <form onSubmit={handleSaveStaffName} className="space-y-4">
              <input
                type="text"
                required
                value={tempStaffName}
                onChange={(e) => setTempStaffName(e.target.value)}
                placeholder="e.g. Mr. Tabi, Mme. Ngassa, Admin"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                autoFocus
              />

              <div className="flex flex-wrap gap-1.5">
                {['Mr. Tabi Stephen', 'Mme. Marie Ngassa', 'Mr. Fokam Paul', 'Mme. Biya Solange', 'Administrator'].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setTempStaffName(preset)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  Save Active Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
