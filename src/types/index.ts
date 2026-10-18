/**
 * Types & Domain Models for Extra Classes Register
 * School: EL SHADDAÏ KOM ABUNDANT LIFE
 */

export type StudentLevel =
  | 'Form 1'
  | 'Form 2'
  | 'Form 3'
  | 'Form 4'
  | 'Form 5'
  | 'Lower Sixth'
  | 'Upper Sixth';

export const ALL_LEVELS: StudentLevel[] = [
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
  'Form 5',
  'Lower Sixth',
  'Upper Sixth',
];

export const COMMON_SUBJECTS: string[] = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English Language',
  'French Language',
  'Economics',
  'Literature in English',
  'History',
  'Geography',
  'Further Mathematics',
  'Accounting',
];

export const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const;
export type AcademicTerm = typeof TERMS[number];

export type BadgeCycle = '1er CYCLE' | '2nd CYCLE' | 'ENSEIGNANT' | 'ADMINISTRATION';

export interface Student {
  id: string; // e.g. "std_xxx" or uuid
  name: string;
  level: StudentLevel;
  subjects: string[];
  phone: string;
  termly_fee: number; // in CFA Francs (XAF)
  termlyFee?: number; // alias for compatibility
  photoUrl?: string; // base64 or URL of student portrait
  matricule?: string; // e.g. "TBA-2026-0001"
  cycle?: BadgeCycle; // 1er CYCLE or 2nd CYCLE etc.
  className?: string; // e.g. "6e", "Form 5", "2nde C"
  academicYear?: string; // e.g. "2026-2027"
  firstName?: string; // e.g. "Jean-Paul"
  lastName?: string; // e.g. "MBARGA"
  createdAt: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  level: StudentLevel;
  subject: string;
  teacher: string;
  createdAt: string;
}

export interface AttendanceMark {
  id: string; // Composite key: `${sessionId}_${studentId}`
  sessionId: string;
  studentId: string;
  present: boolean;
  markedAt: string;
  markedBy?: string;
  markedByUid?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number; // positive for payment, negative for refund
  term: AcademicTerm | string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
  recordedBy?: string;
  recordedByUid?: string;
}

export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  status?: 'active' | 'revoked';
  createdAt: string;
  lastLoginAt?: string;
}

// Derived Models
export interface StudentWithStats extends Student {
  totalPaid: number;
  balance: number; // termly_fee - totalPaid
  attendedCount: number;
  totalSessionsForLevel: number;
  attendanceRate: number; // percentage 0-100
}

export interface SessionWithStats extends Session {
  eligibleStudentCount: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number; // percentage
}
