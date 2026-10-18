/**
 * Export Utilities: PDF and CSV generation
 * Supports Session Attendance sheets, Student Rosters, and Attendance Logs
 */
import { jsPDF } from 'jspdf';
import { Student, Session, AttendanceMark, Payment } from '../types';
import { formatCFA, formatDate } from './formatters';

export function downloadCSV(filename: string, csvContent: string): void {
  // Use UTF-8 BOM (\uFEFF) for proper Excel character display with accents
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export single session attendance to CSV
 */
export function exportSessionAttendanceCSV(
  session: Session,
  students: Student[],
  attendanceMarks: AttendanceMark[]
): void {
  const eligible = students.filter((s) => s.level === session.level);
  const markMap = new Map<string, boolean>();
  attendanceMarks
    .filter((m) => m.sessionId === session.id)
    .forEach((m) => markMap.set(m.studentId, m.present));

  let csv = `School,THE BEST ACADEMY\n`;
  csv += `Program,Extra Classes Tutoring Attendance\n`;
  csv += `Date,${session.date}\n`;
  csv += `Level,${session.level}\n`;
  csv += `Subject,${session.subject}\n`;
  csv += `Teacher,${session.teacher || 'N/A'}\n\n`;
  csv += `Student ID,Student Name,Level,Phone,Status,Marked Time\n`;

  eligible.forEach((student) => {
    const isMarked = markMap.has(student.id);
    const isPresent = markMap.get(student.id) === true;
    const statusText = !isMarked ? 'Unmarked' : isPresent ? 'PRESENT' : 'ABSENT';
    const markRecord = attendanceMarks.find((m) => m.sessionId === session.id && m.studentId === student.id);
    const markTime = markRecord ? markRecord.markedAt : '';

    csv += `"${student.id}","${student.name.replace(/"/g, '""')}","${student.level}","${student.phone}","${statusText}","${markTime}"\n`;
  });

  const safeFilename = `attendance_${session.level.replace(/\s+/g, '_')}_${session.subject.replace(/\s+/g, '_')}_${session.date}.csv`;
  downloadCSV(safeFilename, csv);
}

/**
 * Export single session attendance to PDF
 */
export function exportSessionAttendancePDF(
  session: Session,
  students: Student[],
  attendanceMarks: AttendanceMark[]
): void {
  const eligible = students.filter((s) => s.level === session.level);
  const markMap = new Map<string, boolean>();
  attendanceMarks
    .filter((m) => m.sessionId === session.id)
    .forEach((m) => markMap.set(m.studentId, m.present));

  let presentCount = 0;
  let absentCount = 0;
  eligible.forEach((s) => {
    if (markMap.get(s.id) === true) presentCount++;
    else if (markMap.get(s.id) === false) absentCount++;
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('THE BEST ACADEMY', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Extra Classes Tutoring Program — Official Attendance Register', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 150, 18);

  // Session metadata box
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 34, 182, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Date:', 18, 41);
  doc.text('Class Level:', 18, 48);
  doc.text('Subject:', 18, 55);

  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(session.date), 48, 41);
  doc.text(session.level, 48, 48);
  doc.text(session.subject, 48, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Teacher:', 105, 41);
  doc.text('Enrolled Students:', 105, 48);
  doc.text('Attendance Rate:', 105, 55);

  doc.setFont('helvetica', 'normal');
  doc.text(session.teacher || 'Unassigned', 142, 41);
  doc.text(`${eligible.length} students`, 142, 48);
  const ratePct = eligible.length > 0 ? Math.round((presentCount / eligible.length) * 100) : 0;
  doc.text(`${presentCount} Present / ${absentCount} Absent (${ratePct}%)`, 142, 55);

  // Table header
  let y = 68;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(14, y, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 17, y + 5.5);
  doc.text('Student ID', 25, y + 5.5);
  doc.text('Student Name', 55, y + 5.5);
  doc.text('Phone / Contact', 115, y + 5.5);
  doc.text('Status', 160, y + 5.5);

  y += 8;

  // Student rows
  eligible.forEach((student, index) => {
    // Check if new page is needed
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    const isMarked = markMap.has(student.id);
    const isPresent = markMap.get(student.id) === true;

    // Row alternating background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 7, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 7, 196, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), 17, y + 4.8);
    doc.text(student.id, 25, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(student.name, 55, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(student.phone || '—', 115, y + 4.8);

    // Status badge
    if (!isMarked) {
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('UNMARKED', 160, y + 4.8);
    } else if (isPresent) {
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.setFont('helvetica', 'bold');
      doc.text('[x] PRESENT', 160, y + 4.8);
    } else {
      doc.setTextColor(185, 28, 28); // red-700
      doc.setFont('helvetica', 'bold');
      doc.text('[ ] ABSENT', 160, y + 4.8);
    }

    y += 7;
  });

  // Footer signatures
  y = Math.max(y + 12, 240);
  if (y > 265) {
    doc.addPage();
    y = 30;
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Teacher Signature: _______________________', 20, y);
  doc.text('Supervising Administrator: _______________________', 110, y);

  doc.setFontSize(7);
  doc.text('Official document of THE BEST ACADEMY Extra Classes Program', 14, 287);

  const safeFilename = `attendance_${session.level.replace(/\s+/g, '_')}_${session.date}.pdf`;
  doc.save(safeFilename);
}

/**
 * Export overall students roster with balances and attendance rates
 */
export function exportStudentsRosterCSV(
  students: Student[],
  payments: Payment[],
  sessions: Session[],
  attendance: AttendanceMark[]
): void {
  let csv = `School,THE BEST ACADEMY\n`;
  csv += `Report,Students Roster with Fee Balances and Attendance\n`;
  csv += `Export Date,${new Date().toISOString()}\n\n`;
  csv += `ID,Name,Level,Subjects,Phone,Termly Fee (FCFA),Total Paid (FCFA),Outstanding Balance (FCFA),Status,Attendance Rate (%)\n`;

  students.forEach((student) => {
    const studentPayments = payments.filter((p) => p.studentId === student.id);
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = student.termly_fee - totalPaid;
    const paymentStatus = balance <= 0 ? 'Fully Paid' : 'Balance Due';

    const levelSessions = sessions.filter((s) => s.level === student.level);
    const studentMarks = attendance.filter((m) => m.studentId === student.id && m.present);
    const rate = levelSessions.length > 0 ? Math.round((studentMarks.length / levelSessions.length) * 100) : 0;

    const subjectsStr = (student.subjects || []).join('; ');

    csv += `"${student.id}","${student.name.replace(/"/g, '""')}","${student.level}","${subjectsStr}","${student.phone}",${student.termly_fee},${totalPaid},${balance},"${paymentStatus}",${rate}%\n`;
  });

  downloadCSV(`students_roster_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

/**
 * Export payments ledger to CSV
 */
export function exportPaymentsCSV(payments: Payment[], students: Student[]): void {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  let csv = `School,THE BEST ACADEMY\n`;
  csv += `Report,Extra Classes Payments Ledger\n`;
  csv += `Export Date,${new Date().toISOString()}\n\n`;
  csv += `Payment ID,Date,Student Name,Level,Term,Amount (FCFA),Recorded By,Note\n`;

  payments.forEach((p) => {
    const student = studentMap.get(p.studentId);
    const name = student ? student.name : 'Unknown Student';
    const level = student ? student.level : 'N/A';
    const note = p.note ? p.note.replace(/"/g, '""') : '';
    const recordedBy = p.recordedBy ? p.recordedBy.replace(/"/g, '""') : '';

    csv += `"${p.id}","${p.date}","${name}","${level}","${p.term}",${p.amount},"${recordedBy}","${note}"\n`;
  });

  downloadCSV(`payments_ledger_${new Date().toISOString().split('T')[0]}.csv`, csv);
}
