/**
 * Excel (.xlsx) Import & Export Utilities using SheetJS (xlsx)
 * ACADÉMIE THE BEST — Extra Classes Tutoring Register
 */
import * as XLSX from 'xlsx';
import { Student, StudentWithStats, Session, AttendanceMark, Payment, StudentLevel, ALL_LEVELS } from '../types';
import { formatDate } from './formatters';

/**
 * Downloads an official, pre-formatted Excel template for importing students
 */
export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Template Data with Header and Sample Rows
  const templateRows = [
    {
      'Full Name': 'Jean-Paul Mbarga',
      'Level': 'Form 5',
      'Subjects': 'Mathematics, Physics, Chemistry',
      'Phone': '+237 677 23 45 10',
      'Termly Fee (FCFA)': 30000,
      'Matricule (Optional)': 'TBA-2026-0001',
      'Class (Optional)': '6e',
    },
    {
      'Full Name': 'Blessing Bih Che',
      'Level': 'Form 5',
      'Subjects': 'Mathematics, Economics, English Language',
      'Phone': '+237 699 44 12 88',
      'Termly Fee (FCFA)': 30000,
      'Matricule (Optional)': 'TBA-2026-0002',
      'Class (Optional)': '5e',
    },
    {
      'Full Name': 'Emmanuel Tchuente',
      'Level': 'Upper Sixth',
      'Subjects': 'Physics, Chemistry, Biology, Mathematics',
      'Phone': '+237 675 19 82 04',
      'Termly Fee (FCFA)': 35000,
      'Matricule (Optional)': 'TBA-2026-0003',
      'Class (Optional)': 'Tle A',
    },
    {
      'Full Name': 'Kelvin Ngu Fombe',
      'Level': 'Form 3',
      'Subjects': 'Mathematics, English Language, French Language',
      'Phone': '+237 694 33 51 09',
      'Termly Fee (FCFA)': 25000,
      'Matricule (Optional)': 'TBA-2026-0004',
      'Class (Optional)': '4e',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 26 }, // Full Name
    { wch: 16 }, // Level
    { wch: 40 }, // Subjects
    { wch: 20 }, // Phone
    { wch: 20 }, // Termly Fee
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Student Roster');

  // Instructions sheet
  const instructionRows = [
    { 'Field': 'Full Name', 'Required': 'YES', 'Description': 'Student first and last name (e.g. Jean-Paul Mbarga)' },
    { 'Field': 'Level', 'Required': 'YES', 'Description': 'Must be one of: Form 1, Form 2, Form 3, Form 4, Form 5, Lower Sixth, Upper Sixth' },
    { 'Field': 'Subjects', 'Required': 'NO', 'Description': 'Comma-separated subjects (e.g. Mathematics, Physics)' },
    { 'Field': 'Phone', 'Required': 'NO', 'Description': 'Parent or student contact number (e.g. +237 6XX XX XX XX)' },
    { 'Field': 'Termly Fee (FCFA)', 'Required': 'YES', 'Description': 'Term fee in plain CFA francs with no symbols (e.g. 30000)' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(instructionRows);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Instructions & Valid Levels');

  XLSX.writeFile(wb, 'Extra_Classes_Students_Template.xlsx');
}

export interface ParsedStudentRow {
  rowNumber: number;
  name: string;
  level: StudentLevel;
  subjects: string[];
  phone: string;
  termly_fee: number;
  isValid: boolean;
  error?: string;
}

export interface ParseResult {
  validStudents: Omit<Student, 'id' | 'createdAt'>[];
  parsedRows: ParsedStudentRow[];
  errorsCount: number;
}

/**
 * Normalizes user input level to match valid system levels
 */
function normalizeLevel(input: string): StudentLevel | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase().replace(/[-_]/g, ' ');

  if (cleaned.includes('form 1') || cleaned === 'f1') return 'Form 1';
  if (cleaned.includes('form 2') || cleaned === 'f2') return 'Form 2';
  if (cleaned.includes('form 3') || cleaned === 'f3') return 'Form 3';
  if (cleaned.includes('form 4') || cleaned === 'f4') return 'Form 4';
  if (cleaned.includes('form 5') || cleaned === 'f5') return 'Form 5';
  if (cleaned.includes('lower') || cleaned.includes('l6') || cleaned.includes('lower sixth')) return 'Lower Sixth';
  if (cleaned.includes('upper') || cleaned.includes('u6') || cleaned.includes('upper sixth')) return 'Upper Sixth';

  // Direct case-insensitive match against ALL_LEVELS
  const directMatch = ALL_LEVELS.find((l) => l.toLowerCase() === cleaned);
  if (directMatch) return directMatch;

  return null;
}

/**
 * Parses an Excel (.xlsx / .xls) file uploaded by the user
 */
export async function parseStudentsFromExcel(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  // Use the first sheet
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  // Convert to JSON with raw objects
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const parsedRows: ParsedStudentRow[] = [];
  const validStudents: Omit<Student, 'id' | 'createdAt'>[] = [];
  let errorsCount = 0;

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header is row 1, data starts row 2

    // Flexible key mapping (supports English, French, lowercase, spaces)
    let rawName = '';
    let rawLevel = '';
    let rawSubjects = '';
    let rawPhone = '';
    let rawFee: unknown = 0;

    let rawMatricule = '';
    let rawClassName = '';

    Object.entries(row).forEach(([key, value]) => {
      const lowerKey = key.trim().toLowerCase();
      if (lowerKey.includes('name') || lowerKey.includes('nom') || lowerKey.includes('student') || lowerKey === 'eleve') {
        rawName = String(value || '').trim();
      } else if (lowerKey.includes('matricule') || lowerKey.includes('badge') || lowerKey === 'id' || lowerKey.includes('tba')) {
        rawMatricule = String(value || '').trim();
      } else if (lowerKey.includes('classe') || lowerKey === 'class') {
        rawClassName = String(value || '').trim();
      } else if (lowerKey.includes('level') || lowerKey === 'niveau') {
        rawLevel = String(value || '').trim();
      } else if (lowerKey.includes('subject') || lowerKey.includes('matiere') || lowerKey.includes('matieres') || lowerKey.includes('cours')) {
        rawSubjects = String(value || '').trim();
      } else if (lowerKey.includes('phone') || lowerKey.includes('tel') || lowerKey.includes('contact') || lowerKey.includes('telephone')) {
        rawPhone = String(value || '').trim();
      } else if (lowerKey.includes('fee') || lowerKey.includes('frais') || lowerKey.includes('montant') || lowerKey.includes('amount') || lowerKey.includes('termly')) {
        rawFee = value;
      }
    });

    // Validation checks
    let isValid = true;
    let error = '';

    if (!rawName) {
      isValid = false;
      error = 'Missing student name';
    }

    const matchedLevel = normalizeLevel(rawLevel || rawClassName);
    if (!matchedLevel) {
      isValid = false;
      error = error ? `${error}; Invalid level "${rawLevel}"` : `Invalid level "${rawLevel}" (Expected: Form 1-5, Lower Sixth, Upper Sixth)`;
    }

    // Parse numeric fee
    let feeNum = 0;
    if (typeof rawFee === 'number') {
      feeNum = Math.round(rawFee);
    } else if (typeof rawFee === 'string') {
      const cleaned = rawFee.replace(/[^0-9.-]/g, '');
      feeNum = Math.round(parseFloat(cleaned)) || 0;
    }
    if (isNaN(feeNum) || feeNum < 0) {
      isValid = false;
      error = error ? `${error}; Invalid fee` : 'Termly fee must be a valid positive number';
    }

    // Split subjects
    const subjectsList = rawSubjects
      ? rawSubjects
          .split(/[,;/+]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const finalLevel = matchedLevel || 'Form 5';

    parsedRows.push({
      rowNumber,
      name: rawName,
      level: finalLevel,
      subjects: subjectsList,
      phone: rawPhone,
      termly_fee: feeNum,
      isValid,
      error: error || undefined,
    });

    if (isValid) {
      validStudents.push({
        name: rawName,
        level: finalLevel,
        subjects: subjectsList,
        phone: rawPhone,
        termly_fee: feeNum,
        matricule: rawMatricule || undefined,
        className: rawClassName || undefined,
      });
    } else {
      errorsCount++;
    }
  });

  return {
    validStudents,
    parsedRows,
    errorsCount,
  };
}

/**
 * Exports complete student roster and balances to an Excel file (.xlsx)
 */
export function exportStudentsToExcel(
  students: StudentWithStats[],
  payments: Payment[],
  sessions: Session[],
  attendance: AttendanceMark[]
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Student Roster
  const rosterData = students.map((s) => {
    return {
      'Student ID': s.id,
      'Full Name': s.name,
      'Class Level': s.level,
      'Enrolled Subjects': (s.subjects || []).join(', '),
      'Phone / Contact': s.phone || '—',
      'Termly Fee (FCFA)': s.termly_fee,
      'Total Paid (FCFA)': s.totalPaid,
      'Live Balance (FCFA)': s.balance,
      'Payment Status': s.balance <= 0 ? 'Fully Paid' : 'Balance Due',
      'Attendance Rate (%)': `${s.attendanceRate}%`,
      'Classes Attended': `${s.attendedCount} of ${s.totalSessionsForLevel}`,
    };
  });

  const wsRoster = XLSX.utils.json_to_sheet(rosterData);
  wsRoster['!cols'] = [
    { wch: 18 }, // ID
    { wch: 25 }, // Name
    { wch: 14 }, // Level
    { wch: 35 }, // Subjects
    { wch: 18 }, // Phone
    { wch: 18 }, // Fee
    { wch: 18 }, // Paid
    { wch: 18 }, // Balance
    { wch: 16 }, // Status
    { wch: 18 }, // Rate
    { wch: 18 }, // Classes
  ];
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Student Roster');

  // Sheet 2: Level Breakdown Summary
  const levelSummary = ALL_LEVELS.map((lvl) => {
    const lvlStudents = students.filter((s) => s.level === lvl);
    const totalFees = lvlStudents.reduce((sum, s) => sum + s.termly_fee, 0);
    const totalPaid = lvlStudents.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalBalance = lvlStudents.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);
    const avgRate =
      lvlStudents.length > 0
        ? Math.round(lvlStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / lvlStudents.length)
        : 0;

    return {
      'Level': lvl,
      'Enrolled Students': lvlStudents.length,
      'Total Fees Expected (FCFA)': totalFees,
      'Total Collected (FCFA)': totalPaid,
      'Outstanding Balances (FCFA)': totalBalance,
      'Average Attendance Rate': `${avgRate}%`,
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(levelSummary);
  wsSummary['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary by Level');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `THE_BEST_ACADEMY_Extra_Classes_Roster_${todayStr}.xlsx`);
}

/**
 * Exports single session attendance register to an Excel file (.xlsx)
 */
export function exportSessionAttendanceToExcel(
  session: Session,
  students: Student[],
  attendanceMarks: AttendanceMark[]
): void {
  const eligible = students.filter((s) => s.level === session.level);
  const markMap = new Map<string, { present: boolean; markedAt: string; markedBy?: string }>();
  attendanceMarks
    .filter((m) => m.sessionId === session.id)
    .forEach((m) => {
      markMap.set(m.studentId, {
        present: m.present,
        markedAt: m.markedAt,
        markedBy: m.markedBy,
      });
    });

  const wb = XLSX.utils.book_new();

  const rows = eligible.map((student, idx) => {
    const mark = markMap.get(student.id);
    const isMarked = mark !== undefined;
    const isPresent = mark?.present === true;
    const statusText = !isMarked ? 'UNMARKED' : isPresent ? 'PRESENT' : 'ABSENT';

    return {
      '#': idx + 1,
      'Student ID': student.id,
      'Student Name': student.name,
      'Level': student.level,
      'Phone': student.phone || '—',
      'Attendance Status': statusText,
      'Marked Time': mark?.markedAt ? new Date(mark.markedAt).toLocaleTimeString() : '—',
      'Marked By Staff': mark?.markedBy || '—',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 26 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Session Attendance');

  const safeLevel = session.level.replace(/\s+/g, '_');
  const safeSubject = session.subject.replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Attendance_${safeLevel}_${safeSubject}_${session.date}.xlsx`);
}

/**
 * Exports payments audit log to an Excel file (.xlsx)
 */
export function exportPaymentsToExcel(payments: Payment[], students: Student[]): void {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const wb = XLSX.utils.book_new();

  const rows = payments.map((p) => {
    const student = studentMap.get(p.studentId);
    return {
      'Payment ID': p.id,
      'Date': p.date,
      'Student Name': student ? student.name : 'Unknown',
      'Level': student ? student.level : '—',
      'Term': p.term,
      'Amount Paid (FCFA)': p.amount,
      'Recorded By': p.recordedBy || 'Staff',
      'Payment Note / Ref': p.note || '—',
      'Created At': p.createdAt,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Payments Ledger');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `THE_BEST_ACADEMY_Payments_Ledger_${todayStr}.xlsx`);
}
