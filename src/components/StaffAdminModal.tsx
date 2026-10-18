/**
 * StaffAdminModal: Administrator panel for managing staff accounts,
 * viewing audit activity, and revoking staff access if someone leaves.
 */
import React from 'react';
import { useApp } from '../context/AppContext';
import { StaffProfile } from '../types';
import { X, ShieldAlert, UserX, UserCheck, Shield, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '../lib/formatters';

interface StaffAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAdminModal: React.FC<StaffAdminModalProps> = ({ isOpen, onClose }) => {
  const { user, staffList, revokeStaffAccess, reactivateStaffAccess } = useApp();

  if (!isOpen) return null;

  const isCurrentAdmin =
    user?.email === 'labundant012@gmail.com' ||
    staffList.find((s) => s.id === user?.uid)?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">Staff Access & Security Panel</h3>
              <p className="text-xs text-slate-300">
                Manage educator accounts and revoke permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            Per school security requirements, staff access is granted per individual account. If a teacher or administrator leaves, their database access can be revoked immediately below.
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {staffList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No staff members recorded yet.
              </div>
            ) : (
              staffList.map((staff) => {
                const isSelf = staff.id === user?.uid;
                const isRevoked = staff.status === 'revoked';

                return (
                  <div
                    key={staff.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isRevoked ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {staff.name || staff.email}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                            You
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            staff.role === 'admin'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          {staff.role.toUpperCase()}
                        </span>
                        {isRevoked && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">
                            REVOKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{staff.email}</p>
                      {staff.lastLoginAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last login: {formatDateTime(staff.lastLoginAt)}
                        </p>
                      )}
                    </div>

                    {isCurrentAdmin && !isSelf && (
                      <div>
                        {isRevoked ? (
                          <button
                            onClick={() => reactivateStaffAccess(staff.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => revokeStaffAccess(staff.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Revoke Access
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
