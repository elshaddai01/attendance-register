/**
 * Initial Starter Seed Data for ACADÉMIE THE BEST
 * Bilingual Academy - Extra Classes Tutoring Program
 */
import { Student, Session, Payment, AttendanceMark } from '../types';
import { db } from './firebase';
import { writeBatch, doc } from 'firebase/firestore';

export const SAMPLE_STUDENTS: Student[] = [
  {
    id: 'std_01',
    name: 'Jean-Paul Mbarga',
    lastName: 'MBARGA',
    firstName: 'Jean-Paul',
    level: 'Form 1',
    className: '6e',
    matricule: 'TBA-2026-0001',
    cycle: '1er CYCLE',
    academicYear: '2026-2027',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    phone: '+237 677 23 45 10',
    termly_fee: 30000,
    createdAt: '2026-09-10T08:00:00Z',
  },
  {
    id: 'std_02',
    name: 'Marie-Claire Ngono',
    lastName: 'NGONO',
    firstName: 'Marie-Claire',
    level: 'Form 3',
    className: '3e',
    matricule: 'TBA-2026-0002',
    cycle: '1er CYCLE',
    academicYear: '2026-2027',
    subjects: ['Mathematics', 'Computer Science', 'Economics'],
    phone: '+237 699 44 12 88',
    termly_fee: 30000,
    createdAt: '2026-09-10T08:15:00Z',
  },
  {
    id: 'std_03',
    name: 'Joël Ateba',
    lastName: 'ATEBA',
    firstName: 'Joël',
    level: 'Form 4',
    className: '2nde C',
    matricule: 'TBA-2026-0003',
    cycle: '2nd CYCLE',
    academicYear: '2026-2027',
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    phone: '+237 675 19 82 04',
    termly_fee: 35000,
    createdAt: '2026-09-11T09:30:00Z',
  },
  {
    id: 'std_04',
    name: 'Chantal Etoa Marie',
    lastName: 'ETOA',
    firstName: 'Chantal Marie',
    level: 'Upper Sixth',
    className: 'Tle A',
    matricule: 'TBA-2026-0004',
    cycle: '2nd CYCLE',
    academicYear: '2026-2027',
    subjects: ['Literature in English', 'History', 'French Language'],
    phone: '+237 670 99 21 54',
    termly_fee: 35000,
    createdAt: '2026-09-11T10:00:00Z',
  },
  {
    id: 'std_05',
    name: 'Kelvin Ngu Fombe',
    lastName: 'FOMBE',
    firstName: 'Kelvin Ngu',
    level: 'Form 3',
    className: 'Form 3',
    matricule: 'TBA-2026-0005',
    cycle: '1er CYCLE',
    academicYear: '2026-2027',
    subjects: ['Mathematics', 'English Language', 'French Language'],
    phone: '+237 694 33 51 09',
    termly_fee: 25000,
    createdAt: '2026-09-12T11:00:00Z',
  },
  {
    id: 'std_06',
    name: 'Grace Enow Mbi',
    lastName: 'ENOW',
    firstName: 'Grace Mbi',
    level: 'Form 3',
    className: 'Form 3',
    matricule: 'TBA-2026-0006',
    cycle: '1er CYCLE',
    academicYear: '2026-2027',
    subjects: ['Mathematics', 'Biology', 'Chemistry'],
    phone: '+237 681 12 05 99',
    termly_fee: 25000,
    createdAt: '2026-09-12T11:20:00Z',
  },
  {
    id: 'std_07',
    name: 'Arnaud Kamgaing',
    level: 'Lower Sixth',
    subjects: ['Mathematics', 'Physics', 'Computer Science'],
    phone: '+237 678 40 19 22',
    termly_fee: 32000,
    createdAt: '2026-09-13T08:45:00Z',
  },
  {
    id: 'std_08',
    name: 'Sylvie Ngo Biyong',
    level: 'Lower Sixth',
    subjects: ['Economics', 'Literature in English', 'Geography'],
    phone: '+237 696 22 70 81',
    termly_fee: 32000,
    createdAt: '2026-09-13T09:10:00Z',
  },
  {
    id: 'std_09',
    name: 'Cedric Abena',
    level: 'Form 4',
    subjects: ['Mathematics', 'Physics', 'English Language'],
    phone: '+237 655 81 04 33',
    termly_fee: 28000,
    createdAt: '2026-09-14T14:00:00Z',
  },
  {
    id: 'std_10',
    name: 'Vanessa Ndip Ashu',
    level: 'Form 4',
    subjects: ['Biology', 'Chemistry', 'French Language'],
    phone: '+237 674 05 88 16',
    termly_fee: 28000,
    createdAt: '2026-09-14T14:30:00Z',
  },
  {
    id: 'std_11',
    name: 'Patrick Nkemasong',
    level: 'Form 1',
    subjects: ['Mathematics', 'English Language', 'French Language'],
    phone: '+237 691 70 44 20',
    termly_fee: 20000,
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'std_12',
    name: 'Esther Fotso',
    level: 'Form 2',
    subjects: ['Mathematics', 'Biology', 'English Language'],
    phone: '+237 672 55 90 14',
    termly_fee: 22000,
    createdAt: '2026-09-15T09:40:00Z',
  },
];

export const SAMPLE_SESSIONS: Session[] = [
  {
    id: 'ses_01',
    date: '2026-10-12',
    level: 'Form 5',
    subject: 'Mathematics',
    teacher: 'Mr. Tabi Stephen',
    createdAt: '2026-10-12T16:00:00Z',
  },
  {
    id: 'ses_02',
    date: '2026-10-13',
    level: 'Upper Sixth',
    subject: 'Physics',
    teacher: 'Mme. Marie Ngassa',
    createdAt: '2026-10-13T16:00:00Z',
  },
  {
    id: 'ses_03',
    date: '2026-10-14',
    level: 'Form 3',
    subject: 'English Language',
    teacher: 'Mr. Paul Fokam',
    createdAt: '2026-10-14T16:00:00Z',
  },
  {
    id: 'ses_04',
    date: '2026-10-15',
    level: 'Lower Sixth',
    subject: 'Economics',
    teacher: 'Mr. Tabi Stephen',
    createdAt: '2026-10-15T16:00:00Z',
  },
  {
    id: 'ses_05',
    date: '2026-10-16',
    level: 'Form 5',
    subject: 'Physics',
    teacher: 'Mme. Marie Ngassa',
    createdAt: '2026-10-16T16:00:00Z',
  },
  {
    id: 'ses_06',
    date: '2026-10-17',
    level: 'Upper Sixth',
    subject: 'Chemistry',
    teacher: 'Mme. Biya Solange',
    createdAt: '2026-10-17T16:00:00Z',
  },
];

export const SAMPLE_ATTENDANCE: AttendanceMark[] = [
  // ses_01 (Form 5: std_01, std_02)
  { id: 'ses_01_std_01', sessionId: 'ses_01', studentId: 'std_01', present: true, markedAt: '2026-10-12T16:30:00Z', markedBy: 'Mr. Tabi' },
  { id: 'ses_01_std_02', sessionId: 'ses_01', studentId: 'std_02', present: true, markedAt: '2026-10-12T16:32:00Z', markedBy: 'Mr. Tabi' },
  // ses_02 (Upper Sixth: std_03, std_04)
  { id: 'ses_02_std_03', sessionId: 'ses_02', studentId: 'std_03', present: true, markedAt: '2026-10-13T16:30:00Z', markedBy: 'Mme. Ngassa' },
  { id: 'ses_02_std_04', sessionId: 'ses_02', studentId: 'std_04', present: false, markedAt: '2026-10-13T16:35:00Z', markedBy: 'Mme. Ngassa' },
  // ses_03 (Form 3: std_05, std_06)
  { id: 'ses_03_std_05', sessionId: 'ses_03', studentId: 'std_05', present: true, markedAt: '2026-10-14T16:25:00Z', markedBy: 'Mr. Fokam' },
  { id: 'ses_03_std_06', sessionId: 'ses_03', studentId: 'std_06', present: true, markedAt: '2026-10-14T16:26:00Z', markedBy: 'Mr. Fokam' },
  // ses_04 (Lower Sixth: std_07, std_08)
  { id: 'ses_04_std_07', sessionId: 'ses_04', studentId: 'std_07', present: true, markedAt: '2026-10-15T16:31:00Z', markedBy: 'Mr. Tabi' },
  { id: 'ses_04_std_08', sessionId: 'ses_04', studentId: 'std_08', present: true, markedAt: '2026-10-15T16:32:00Z', markedBy: 'Mr. Tabi' },
  // ses_05 (Form 5: std_01, std_02)
  { id: 'ses_05_std_01', sessionId: 'ses_05', studentId: 'std_01', present: true, markedAt: '2026-10-16T16:30:00Z', markedBy: 'Mme. Ngassa' },
  { id: 'ses_05_std_02', sessionId: 'ses_05', studentId: 'std_02', present: false, markedAt: '2026-10-16T16:35:00Z', markedBy: 'Mme. Ngassa' },
];

export const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: 'pay_01',
    studentId: 'std_01',
    amount: 30000,
    term: 'Term 1',
    date: '2026-09-12',
    note: 'Full payment via Orange Money (ref #8892)',
    createdAt: '2026-09-12T10:00:00Z',
    recordedBy: 'Admin Mme. Marie',
  },
  {
    id: 'pay_02',
    studentId: 'std_02',
    amount: 15000,
    term: 'Term 1',
    date: '2026-09-15',
    note: '1st Installment (Cash at Bursar office)',
    createdAt: '2026-09-15T11:30:00Z',
    recordedBy: 'Admin Mme. Marie',
  },
  {
    id: 'pay_03',
    studentId: 'std_03',
    amount: 20000,
    term: 'Term 1',
    date: '2026-09-18',
    note: 'Partial payment by parent Mr. Tchuente',
    createdAt: '2026-09-18T14:10:00Z',
    recordedBy: 'Mr. Tabi',
  },
  {
    id: 'pay_04',
    studentId: 'std_05',
    amount: 25000,
    term: 'Term 1',
    date: '2026-09-20',
    note: 'Full payment (MTN MoMo ref #4102)',
    createdAt: '2026-09-20T16:00:00Z',
    recordedBy: 'Admin Mme. Marie',
  },
  {
    id: 'pay_05',
    studentId: 'std_07',
    amount: 16000,
    term: 'Term 1',
    date: '2026-09-25',
    note: '50% installment',
    createdAt: '2026-09-25T09:20:00Z',
    recordedBy: 'Mr. Tabi',
  },
];

export async function seedInitialDatabase(): Promise<void> {
  const batch = writeBatch(db);

  // Add students
  SAMPLE_STUDENTS.forEach((s) => {
    batch.set(doc(db, 'students', s.id), s);
  });

  // Add sessions
  SAMPLE_SESSIONS.forEach((ses) => {
    batch.set(doc(db, 'sessions', ses.id), ses);
  });

  // Add attendance marks
  SAMPLE_ATTENDANCE.forEach((att) => {
    batch.set(doc(db, 'attendance', att.id), att);
  });

  // Add payments
  SAMPLE_PAYMENTS.forEach((p) => {
    batch.set(doc(db, 'payments', p.id), p);
  });

  await batch.commit();
}
