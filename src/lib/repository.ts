/**
 * Firestore Real-Time Repository & Subscriptions
 * Subscribes to students, sessions, attendance, payments with onSnapshot
 * Supports atomic upserts, cascading deletes, and error handling.
 */
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, Session, AttendanceMark, Payment, StaffProfile } from '../types';

export function subscribeStudents(onUpdate: (students: Student[]) => void, onError?: (err: unknown) => void): Unsubscribe {
  const colPath = 'students';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as Student), id: d.id });
      });
      // Sort alphabetically by name
      list.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export function subscribeSessions(onUpdate: (sessions: Session[]) => void, onError?: (err: unknown) => void): Unsubscribe {
  const colPath = 'sessions';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list: Session[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as Session), id: d.id });
      });
      // Sort newest date first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export function subscribeAttendance(onUpdate: (attendance: AttendanceMark[]) => void, onError?: (err: unknown) => void): Unsubscribe {
  const colPath = 'attendance';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list: AttendanceMark[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as AttendanceMark), id: d.id });
      });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export function subscribePayments(onUpdate: (payments: Payment[]) => void, onError?: (err: unknown) => void): Unsubscribe {
  const colPath = 'payments';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as Payment), id: d.id });
      });
      // Sort newest payment first
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export function subscribeStaff(onUpdate: (staff: StaffProfile[]) => void, onError?: (err: unknown) => void): Unsubscribe {
  const colPath = 'staff';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      const list: StaffProfile[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as StaffProfile), id: d.id });
      });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

// Student Operations
export async function saveStudent(student: Student): Promise<void> {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function bulkSaveStudents(studentsList: Omit<Student, 'id' | 'createdAt'>[]): Promise<number> {
  if (studentsList.length === 0) return 0;
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let count = 0;

    studentsList.forEach((data) => {
      const randomHex = Math.random().toString(36).substring(2, 8);
      const newId = `std_${Date.now().toString(36)}_${randomHex}_${count}`;
      const record: Student = {
        ...data,
        id: newId,
        createdAt: now,
      };
      batch.set(doc(db, 'students', newId), record);
      count++;
    });

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'students/bulk_import');
  }
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const path = `students/${id}`;
  try {
    await updateDoc(doc(db, 'students', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Cascading Delete for Student:
 * Removes student document AND all associated attendance marks and payments.
 */
export async function deleteStudentCascade(studentId: string): Promise<void> {
  const studentPath = `students/${studentId}`;
  try {
    const batch = writeBatch(db);

    // 1. Delete student doc
    batch.delete(doc(db, 'students', studentId));

    // 2. Query and delete all attendance marks for this student
    const attSnap = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', studentId)));
    attSnap.forEach((attDoc) => {
      batch.delete(attDoc.ref);
    });

    // 3. Query and delete all payments for this student
    const paySnap = await getDocs(query(collection(db, 'payments'), where('studentId', '==', studentId)));
    paySnap.forEach((payDoc) => {
      batch.delete(payDoc.ref);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, studentPath);
  }
}

// Session Operations
export async function saveSession(session: Session): Promise<void> {
  const path = `sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'sessions', session.id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSessionCascade(sessionId: string): Promise<void> {
  const path = `sessions/${sessionId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'sessions', sessionId));

    const attSnap = await getDocs(query(collection(db, 'attendance'), where('sessionId', '==', sessionId)));
    attSnap.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Attendance Operations: Atomic Upsert Keyed by `${sessionId}_${studentId}`
export async function setAttendanceMark(
  sessionId: string,
  studentId: string,
  present: boolean,
  markedBy?: string,
  markedByUid?: string
): Promise<void> {
  const markId = `${sessionId}_${studentId}`;
  const path = `attendance/${markId}`;
  const record: AttendanceMark = {
    id: markId,
    sessionId,
    studentId,
    present,
    markedAt: new Date().toISOString(),
    markedBy: markedBy || 'Staff',
    markedByUid: markedByUid || '',
  };
  try {
    await setDoc(doc(db, 'attendance', markId), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function bulkSetAttendance(
  sessionId: string,
  studentIds: string[],
  present: boolean,
  markedBy?: string,
  markedByUid?: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    studentIds.forEach((studentId) => {
      const markId = `${sessionId}_${studentId}`;
      const record: AttendanceMark = {
        id: markId,
        sessionId,
        studentId,
        present,
        markedAt: now,
        markedBy: markedBy || 'Staff',
        markedByUid: markedByUid || '',
      };
      batch.set(doc(db, 'attendance', markId), record);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `attendance/bulk_${sessionId}`);
  }
}

// Payment Operations
export async function savePayment(payment: Payment): Promise<void> {
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePayment(paymentId: string): Promise<void> {
  const path = `payments/${paymentId}`;
  try {
    await deleteDoc(doc(db, 'payments', paymentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Staff Operations
export async function saveStaff(staff: StaffProfile): Promise<void> {
  const path = `staff/${staff.id}`;
  try {
    await setDoc(doc(db, 'staff', staff.id), staff);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateStaffStatus(staffId: string, status: 'active' | 'revoked'): Promise<void> {
  const path = `staff/${staffId}`;
  try {
    await updateDoc(doc(db, 'staff', staffId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
