/**
 * StaffAuthScreen: High-security authentication portal
 * Restricts all data access and badge resolution behind verified staff credentials.
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, LogIn, Lock, AlertCircle, Sparkles, School } from 'lucide-react';

export const StaffAuthScreen: React.FC = () => {
  const { signInWithGoogle, error, clearError } = useApp();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    clearError();
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="w-full max-w-md relative z-10">
        {/* School Crest Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-xl ring-4 ring-slate-800 tracking-wider">
            TBA
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mt-4">
            <Sparkles className="w-3.5 h-3.5" />
            THE BEST ACADEMY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Extra Classes Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official Tutoring & Attendance System
          </p>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Staff Authentication Required
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Student records, QR badges, and fee ledgers are protected. Every staff member must sign in with their individual account.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Sign-In Button */}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>{signingIn ? 'Verifying Credentials...' : 'Sign In with Staff Account'}</span>
          </button>

          {/* Security & Audit Policies */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-[11px] text-slate-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Database-level access control</strong>: Requests are verified by Cloud Firestore security rules.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Audit trail active</strong>: All session attendance marks and fee payments record the educator's ID.
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          For technical access or account provisioning, contact the school administrator.
        </p>
      </div>
    </div>
  );
};
