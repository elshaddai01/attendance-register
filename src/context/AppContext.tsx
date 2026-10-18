/**
 * Application Context & State Management
 * Connects Firebase onSnapshot real-time subscriptions,
 * maintains derived balances and attendance rates, and exposes staff actions.
 */
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../lib/firebase';
import {
  subscribeStudents,
  subscribeSessions,
  subscribeAttendance,
  subscribePayments,
  subscribeStaff,
  saveStudent,
  bulkSaveStudents,
  updateStudent,
  deleteStudentCascade,
  saveSession,
  deleteSessionCascade,
  setAttendanceMark,
  bulkSetAttendance,
  savePayment,
  deletePayment,
  saveStaff,
  updateStaffStatus,
} from '../lib/repository';
import {
  Student,
  Session,
  AttendanceMark,
  Payment,
  StaffProfile,
  StudentWithStats,
  SessionWithStats,
} from '../types';
import { seedInitialDatabase } from '../lib/mockData';

interface AppContextType {
  user: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  currentStaffName: string;
  setCurrentStaffName: (name: string) => void;
  students: Student[];
  sessions: Session[];
  attendance: AttendanceMark[];
  payments: Payment[];
  staffList: StaffProfile[];
  dataLoading: boolean;
  connectionOnline: boolean;
  error: string | null;
  clearError: () => void;

  // Derived Values
  studentsWithStats: StudentWithStats[];
  sessionsWithStats: SessionWithStats[];
  totalFeesOutstanding: number;
  overallAttendanceRateLast10: number;
  recentSessions: Session[];
  topDebtors: StudentWithStats[];

  // Helpers
  getStudentById: (id: string) => StudentWithStats | undefined;
  getSessionById: (id: string) => SessionWithStats | undefined;
  getStudentAttendanceMapForSession: (sessionId: string) => Map<string, boolean>;

  // Actions
  addStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Promise<string>;
  bulkImportStudents: (studentsList: Omit<Student, 'id' | 'createdAt'>[]) => Promise<number>;
  editStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  addSession: (data: Omit<Session, 'id' | 'createdAt'>) => Promise<string>;
  removeSession: (id: string) => Promise<void>;
  markAttendance: (sessionId: string, studentId: string, present: boolean) => Promise<void>;
  markAllAttendance: (sessionId: string, studentIds: string[], present: boolean) => Promise<void>;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Promise<string>;
  removePayment: (paymentId: string) => Promise<void>;
  revokeStaffAccess: (staffId: string) => Promise<void>;
  reactivateStaffAccess: (staffId: string) => Promise<void>;
  loadSampleData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStaffName, setCurrentStaffName] = useState<string>(() => {
    return localStorage.getItem('xcls_staff_name') || 'Staff Member';
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMark[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [connectionOnline, setConnectionOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync staff name to localStorage
  const updateStaffName = (name: string) => {
    setCurrentStaffName(name);
    localStorage.setItem('xcls_staff_name', name);
  };

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser?.displayName && currentStaffName === 'Staff Member') {
        updateStaffName(currentUser.displayName);
      }
    });

    testConnection().then((online) => {
      setConnectionOnline(online);
    });

    return () => unsubAuth();
  }, []);

  // Data Subscriptions (active when auth state is resolved)
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    // Attach listeners
    setDataLoading(true);

    const unsubStudents = subscribeStudents(
      (data) => {
        setStudents(data);
        setDataLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to students', err);
        setError('Real-time connection issue with students roster.');
        setDataLoading(false);
      }
    );
    unsubs.push(unsubStudents);

    const unsubSessions = subscribeSessions(
      (data) => {
        setSessions(data);
      },
      (err) => {
        console.error('Failed to subscribe to sessions', err);
      }
    );
    unsubs.push(unsubSessions);

    const unsubAttendance = subscribeAttendance(
      (data) => {
        setAttendance(data);
      },
      (err) => {
        console.error('Failed to subscribe to attendance', err);
      }
    );
    unsubs.push(unsubAttendance);

    const unsubPayments = subscribePayments(
      (data) => {
        setPayments(data);
      },
      (err) => {
        console.error('Failed to subscribe to payments', err);
      }
    );
    unsubs.push(unsubPayments);

    const unsubStaff = subscribeStaff(
      (data) => {
        setStaffList(data);
      },
      () => {}
    );
    unsubs.push(unsubStaff);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  // DERIVED VALUES: Computed at read time from data
  // Student Balances & Attendance Rates
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    // 1. Group payments by studentId
    const paymentSums = new Map<string, number>();
    payments.forEach((p) => {
      const current = paymentSums.get(p.studentId) || 0;
      paymentSums.set(p.studentId, current + (p.amount || 0));
    });

    // 2. Group attendance by studentId
    const attendancePresent = new Map<string, number>();
    attendance.forEach((att) => {
      if (att.present) {
        const cur = attendancePresent.get(att.studentId) || 0;
        attendancePresent.set(att.studentId, cur + 1);
      }
    });

    // 3. Count total sessions for each level
    const sessionsByLevel = new Map<string, number>();
    sessions.forEach((s) => {
      const cur = sessionsByLevel.get(s.level) || 0;
      sessionsByLevel.set(s.level, cur + 1);
    });

    return students.map((student) => {
      const totalPaid = paymentSums.get(student.id) || 0;
      const balance = (student.termly_fee || 0) - totalPaid;
      const attendedCount = attendancePresent.get(student.id) || 0;
      const totalSessionsForLevel = sessionsByLevel.get(student.level) || 0;
      const attendanceRate = totalSessionsForLevel > 0
        ? Math.round((attendedCount / totalSessionsForLevel) * 100)
        : 0;

      return {
        ...student,
        totalPaid,
        balance,
        attendedCount,
        totalSessionsForLevel,
        attendanceRate,
      };
    });
  }, [students, payments, attendance, sessions]);

  // Sessions with Attendance Stats
  const sessionsWithStats: SessionWithStats[] = useMemo(() => {
    const studentCountByLevel = new Map<string, number>();
    students.forEach((s) => {
      const count = studentCountByLevel.get(s.level) || 0;
      studentCountByLevel.set(s.level, count + 1);
    });

    const marksBySession = new Map<string, { present: number; absent: number }>();
    attendance.forEach((m) => {
      const cur = marksBySession.get(m.sessionId) || { present: 0, absent: 0 };
      if (m.present) {
        cur.present += 1;
      } else {
        cur.absent += 1;
      }
      marksBySession.set(m.sessionId, cur);
    });

    return sessions.map((session) => {
      const eligibleStudentCount = studentCountByLevel.get(session.level) || 0;
      const marks = marksBySession.get(session.id) || { present: 0, absent: 0 };
      const totalMarks = marks.present + marks.absent;
      const attendanceRate = totalMarks > 0
        ? Math.round((marks.present / totalMarks) * 100)
        : eligibleStudentCount > 0
        ? Math.round((marks.present / eligibleStudentCount) * 100)
        : 0;

      return {
        ...session,
        eligibleStudentCount,
        presentCount: marks.present,
        absentCount: marks.absent,
        attendanceRate,
      };
    });
  }, [sessions, students, attendance]);

  // Total Fees Outstanding (sum of positive student balances)
  const totalFeesOutstanding = useMemo(() => {
    return studentsWithStats.reduce((acc, s) => {
      return s.balance > 0 ? acc + s.balance : acc;
    }, 0);
  }, [studentsWithStats]);

  // Attendance rate over the last 10 sessions: present marks ÷ total marks
  const overallAttendanceRateLast10 = useMemo(() => {
    if (sessions.length === 0) return 0;
    const last10Sessions = sessions.slice(0, 10);
    const last10Ids = new Set(last10Sessions.map((s) => s.id));

    let totalMarks = 0;
    let presentMarks = 0;

    attendance.forEach((m) => {
      if (last10Ids.has(m.sessionId)) {
        totalMarks += 1;
        if (m.present) presentMarks += 1;
      }
    });

    if (totalMarks === 0) return 0;
    return Math.round((presentMarks / totalMarks) * 100);
  }, [sessions, attendance]);

  // 6 most recent sessions
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 6);
  }, [sessions]);

  // 5 students with the largest outstanding balance (balance > 0)
  const topDebtors = useMemo(() => {
    return [...studentsWithStats]
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [studentsWithStats]);

  // Quick lookups
  const getStudentById = (id: string) => {
    return studentsWithStats.find((s) => s.id === id);
  };

  const getSessionById = (id: string) => {
    return sessionsWithStats.find((s) => s.id === id);
  };

  const getStudentAttendanceMapForSession = (sessionId: string) => {
    const map = new Map<string, boolean>();
    attendance
      .filter((m) => m.sessionId === sessionId)
      .forEach((m) => map.set(m.studentId, m.present));
    return map;
  };

  // ACTIONS
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const isAdminUser = res.user.email === 'labundant012@gmail.com';
        const staffObj: StaffProfile = {
          id: res.user.uid,
          email: res.user.email || '',
          name: res.user.displayName || res.user.email || 'Staff Member',
          role: isAdminUser ? 'admin' : 'teacher',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveStaff(staffObj);
        updateStaffName(res.user.displayName || res.user.email || 'Staff Member');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Google Sign-In was cancelled or failed.');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const addStudent = async (data: Omit<Student, 'id' | 'createdAt'>): Promise<string> => {
    // Generate clean unique ID
    const randomHex = Math.random().toString(36).substring(2, 8);
    const newId = `std_${Date.now().toString(36)}_${randomHex}`;
    const newStudent: Student = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await saveStudent(newStudent);
    return newId;
  };

  const bulkImportStudents = async (studentsList: Omit<Student, 'id' | 'createdAt'>[]): Promise<number> => {
    return await bulkSaveStudents(studentsList);
  };

  const editStudent = async (id: string, updates: Partial<Student>) => {
    await updateStudent(id, updates);
  };

  const removeStudent = async (id: string) => {
    await deleteStudentCascade(id);
  };

  const addSession = async (data: Omit<Session, 'id' | 'createdAt'>): Promise<string> => {
    const randomHex = Math.random().toString(36).substring(2, 8);
    const newId = `ses_${Date.now().toString(36)}_${randomHex}`;
    const newSession: Session = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    await saveSession(newSession);
    return newId;
  };

  const removeSession = async (id: string) => {
    await deleteSessionCascade(id);
  };

  const markAttendance = async (sessionId: string, studentId: string, present: boolean) => {
    await setAttendanceMark(sessionId, studentId, present, currentStaffName, user?.uid || '');
  };

  const markAllAttendance = async (sessionId: string, studentIds: string[], present: boolean) => {
    await bulkSetAttendance(sessionId, studentIds, present, currentStaffName, user?.uid || '');
  };

  const addPayment = async (data: Omit<Payment, 'id' | 'createdAt'>): Promise<string> => {
    const randomHex = Math.random().toString(36).substring(2, 8);
    const newId = `pay_${Date.now().toString(36)}_${randomHex}`;
    const newPayment: Payment = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      recordedBy: data.recordedBy || currentStaffName,
      recordedByUid: user?.uid || '',
    };
    await savePayment(newPayment);
    return newId;
  };

  const removePayment = async (paymentId: string) => {
    await deletePayment(paymentId);
  };

  const revokeStaffAccess = async (staffId: string) => {
    await updateStaffStatus(staffId, 'revoked');
  };

  const reactivateStaffAccess = async (staffId: string) => {
    await updateStaffStatus(staffId, 'active');
  };

  const loadSampleData = async () => {
    setError(null);
    try {
      await seedInitialDatabase();
    } catch (err) {
      console.error('Failed to load sample data:', err);
      setError('Could not populate sample data.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        signInWithGoogle,
        signOutUser,
        currentStaffName,
        setCurrentStaffName: updateStaffName,
        students,
        sessions,
        attendance,
        payments,
        staffList,
        dataLoading,
        connectionOnline,
        error,
        clearError: () => setError(null),

        studentsWithStats,
        sessionsWithStats,
        totalFeesOutstanding,
        overallAttendanceRateLast10,
        recentSessions,
        topDebtors,

        getStudentById,
        getSessionById,
        getStudentAttendanceMapForSession,

        addStudent,
        bulkImportStudents,
        editStudent,
        removeStudent,
        addSession,
        removeSession,
        markAttendance,
        markAllAttendance,
        addPayment,
        removePayment,
        revokeStaffAccess,
        reactivateStaffAccess,
        loadSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
