import { useState, useEffect } from 'react';
import {
  BookOpen,
  Wallet,
  Clock,
  LogOut,
  Users,
  TrendingUp,
  Loader2,
  ScanLine,
  Search,
  PlusCircle,
  CheckCircle,
  X,
  UserCheck,
  ChevronLeft,
  Key,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  logoutUser,
  subscribeToCollection,
  subscribeToTeacherClasses,
  auth,
  addManualTransaction
} from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import SubjectKeyInput from '../../components/SubjectKeyInput';

interface TeacherDashboardProps {
  transactions: any[];
}

export default function TeacherDashboard({ transactions }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    let done = 0;
    const check = () => {
      done++;
      if (done >= 3) setLoading(false);
    };

    // Strict subscription filtering by teacherId === currentUser.uid
    const u1 = subscribeToTeacherClasses(uid, (classesData: any[]) => {
      setMyClasses(classesData);
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      check();
    });

    const u2 = subscribeToCollection('students', (studentsData: any[]) => {
      setStudents(studentsData.filter(s => s.name && s.name.trim() !== ''));
      check();
    });

    const u3 = subscribeToCollection('schedule', (scheduleData: any[]) => {
      setSchedule(scheduleData);
      check();
    });

    return () => {
      u1();
      u2();
      u3();
    };
  }, [uid]);

  // Filter transactions for teacher's classes
  const myTransactions = transactions.filter(t =>
    myClasses.some(c => c.id === t.classId)
  );

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = myTransactions
    .filter(t => t.timestamp?.startsWith(today))
    .reduce((sum, t) => sum + (t.teacherShare || 0), 0);

  const thisMonth = new Date().toISOString().substring(0, 7);
  const monthRevenue = myTransactions
    .filter(t => t.timestamp?.startsWith(thisMonth))
    .reduce((sum, t) => sum + (t.teacherShare || 0), 0);

  const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const todayDay = DAYS_AR[new Date().getDay()];

  const todaySchedule = schedule
    .filter(s => s.day === todayDay && myClasses.some(c => c.id === s.classId))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const activeClass = myClasses.find(c => c.id === selectedClassId) || (myClasses.length > 0 ? myClasses[0] : null);

  // Enrolled students for selected class
  const enrolledStudents = activeClass
    ? students.filter(s => (s.classIds || []).includes(activeClass.id))
    : [];

  const filteredEnrolledStudents = enrolledStudents.filter(s =>
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.studentCode || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Financial stats for active class
  const activeClassTransactions = activeClass
    ? myTransactions.filter(t => t.classId === activeClass.id)
    : [];

  const activeClassTotalAttendanceCount = activeClassTransactions.length;
  const activeClassEarnings = activeClassTransactions.reduce((sum, t) => sum + (t.teacherShare || 0), 0);

  // Manual attendance marking for a student
  const handleMarkManualAttendance = async (studentId: string) => {
    if (!activeClass) return;
    setActionLoading(studentId);
    setActionMessage(null);
    try {
      await addManualTransaction(studentId, activeClass.id, students, myClasses);
      setActionMessage('تم تسجيل الحضور بنجاح!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء تسجيل الحضور');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // --- SCREEN 1: NO LINKED CLASSES (EMPTY STATE) ---
  if (myClasses.length === 0) {
    return (
      <div className="container flex-col gap-lg" style={{ paddingTop: '24px' }}>
        <div className="flex justify-between items-center">
          <div className="flex-col">
            <h1 style={{ margin: 0, fontSize: '22px' }}>لوحة الأستاذ</h1>
            <span className="text-secondary" style={{ fontSize: '12px' }}>
              مرحباً بك في المنظومة التعليمية
            </span>
          </div>
          <button className="btn-icon" onClick={logoutUser} title="تسجيل الخروج">
            <LogOut size={20} />
          </button>
        </div>

        <div className="card flex-col items-center text-center gap-md" style={{ padding: '36px 24px', border: '1px dashed var(--primary)' }}>
          <div
            className="btn-icon"
            style={{ width: '72px', height: '72px', background: 'rgba(255, 95, 31, 0.15)', color: 'var(--primary)', border: '2px solid var(--primary)' }}
          >
            <BookOpen size={36} />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>لم يتم ربط أي مادة بعد</h2>
          <p className="text-secondary" style={{ fontSize: '13px', maxWidth: '380px' }}>
            للبدء في إدارة طلابك ومتابعة الحضور والمستحقات المالية، يرجى إدخال <b>رمز المادة الفريد (Subject Key)</b> الممنوح لك من طرف إدارة المدرسة.
          </p>
        </div>

        <SubjectKeyInput
          onSuccess={() => {
            // Firestore listener will automatically update state
          }}
        />

        <div style={{ height: '60px' }}></div>
      </div>
    );
  }

  // --- SCREEN 2: MAIN TEACHER DASHBOARD ---
  return (
    <div className="container flex-col gap-lg" style={{ paddingTop: '16px' }}>
      {/* Top Header */}
      <div className="flex justify-between items-center mt-sm">
        <div className="flex-col">
          <h1 style={{ margin: 0, fontSize: '22px' }}>لوحة تحكم الأستاذ</h1>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-sm">
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '12px' }}
            onClick={() => setShowLinkModal(true)}
          >
            <PlusCircle size={15} /> إضافة مادة
          </button>
          <button className="btn-icon" onClick={logoutUser} title="تسجيل الخروج">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          className="card flex-col gap-xs"
          style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255,95,31,0.12), rgba(255,95,31,0.04))' }}
        >
          <Wallet size={20} color="var(--primary)" />
          <span className="text-secondary" style={{ fontSize: '11px' }}>إجمالي اليوم</span>
          <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: 'var(--primary)' }}>
            {todayRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small>
          </span>
        </div>
        <div className="card flex-col gap-xs" style={{ padding: '16px' }}>
          <TrendingUp size={20} color="#60a5fa" />
          <span className="text-secondary" style={{ fontSize: '11px' }}>إجمالي الشهر</span>
          <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: '#60a5fa' }}>
            {monthRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small>
          </span>
        </div>
      </div>

      {/* SECTION: SUBJECTS & CLASSES SELECTION */}
      <div className="flex-col gap-sm">
        <div className="flex justify-between items-center">
          <h3 style={{ margin: 0, fontSize: '15px' }} className="flex items-center gap-sm">
            <BookOpen size={16} color="var(--primary)" /> موادي والأفواج ({myClasses.length})
          </h3>
          <span className="text-secondary" style={{ fontSize: '11px' }}>اضغط على المادة لعرض تفاصيلها</span>
        </div>

        <div className="flex gap-sm" style={{ overflowX: 'auto', paddingBottom: '6px', margin: '0 -20px', padding: '0 20px' }}>
          {myClasses.map(cls => {
            const isSelected = activeClass?.id === cls.id;
            const clsStudentsCount = students.filter(s => (s.classIds || []).includes(cls.id)).length;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`card flex-col gap-xs ${isSelected ? 'active' : ''}`}
                style={{
                  minWidth: '180px',
                  padding: '14px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--surface-container-highest)',
                  background: isSelected ? 'rgba(255, 95, 31, 0.08)' : 'var(--surface)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? 'var(--primary)' : 'var(--on-surface)' }}>
                    {cls.name}
                  </span>
                  {cls.subjectKey && (
                    <span className="chip primary font-en" style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {cls.subjectKey}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-xs" style={{ fontSize: '11px' }}>
                  <span className="text-secondary flex items-center gap-xs">
                    <Users size={12} /> {clsStudentsCount} طالب
                  </span>
                  <span className="font-en" style={{ color: '#4ade80', fontWeight: 600 }}>
                    {cls.fee} DA
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED SUBJECT DETAILS VIEW */}
      {activeClass && (
        <div className="card flex-col gap-md" style={{ border: '1px solid var(--primary)', background: 'rgba(255, 95, 31, 0.03)' }}>
          {/* Header of Active Class */}
          <div className="flex justify-between items-start pb-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-col gap-xs">
              <div className="flex items-center gap-sm">
                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)' }}>{activeClass.name}</h2>
                {activeClass.subjectKey && (
                  <span className="chip primary font-en" style={{ fontSize: '10px' }}>
                    Key: {activeClass.subjectKey}
                  </span>
                )}
              </div>
              <span className="text-secondary" style={{ fontSize: '12px' }}>
                سعر الحصة: <b>{activeClass.fee} DA</b>
              </span>
            </div>

            {/* Quick QR Scan Action Button for this Subject */}
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px' }}
              onClick={() => navigate('/scanner')}
            >
              <ScanLine size={16} /> بدء أخذ الحضور (QR)
            </button>
          </div>

          {/* Subject-Specific Financial Stats (Requirement 3.ج) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="flex-col gap-xs" style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--surface-container-highest)' }}>
              <span className="text-secondary" style={{ fontSize: '10px' }}>الطلاب المسجلين</span>
              <span className="number" style={{ fontWeight: 700, fontSize: '16px', color: '#a78bfa' }}>
                {enrolledStudents.length}
              </span>
            </div>

            <div className="flex-col gap-xs" style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--surface-container-highest)' }}>
              <span className="text-secondary" style={{ fontSize: '10px' }}>مجموع الحضور الحركات</span>
              <span className="number" style={{ fontWeight: 700, fontSize: '16px', color: '#60a5fa' }}>
                {activeClassTotalAttendanceCount} <small style={{ fontSize: '9px' }}>حصة</small>
              </span>
            </div>

            <div className="flex-col gap-xs" style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--surface-container-highest)' }}>
              <span className="text-secondary" style={{ fontSize: '10px' }}>مستحقات المادة</span>
              <span className="number" style={{ fontWeight: 700, fontSize: '16px', color: '#4ade80' }}>
                {activeClassEarnings.toLocaleString()} <small style={{ fontSize: '9px' }}>DA</small>
              </span>
            </div>
          </div>

          {/* Notification Message */}
          {actionMessage && (
            <div className="card flex items-center gap-sm" style={{ padding: '10px 14px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', borderRadius: '12px', fontSize: '12px' }}>
              <CheckCircle size={16} />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Enrolled Students List for this Subject (Requirement 3.أ) */}
          <div className="flex-col gap-sm mt-xs">
            <div className="flex justify-between items-center">
              <h4 style={{ margin: 0, fontSize: '14px' }} className="flex items-center gap-xs">
                <Users size={15} color="var(--primary)" /> طلاب الفوج ({enrolledStudents.length})
              </h4>
              <button
                className="btn-ghost py-xs"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => navigate('/scanner')}
              >
                <ScanLine size={12} /> المسح الضوئي
              </button>
            </div>

            {/* Search Input for Enrolled Students */}
            <div className="relative w-full">
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <Search size={16} className="text-secondary" />
              </span>
              <input
                type="text"
                className="input-field w-full"
                placeholder="البحث باسم الطالب أو الكود..."
                style={{ paddingRight: '40px', paddingLeft: '14px', height: '40px', fontSize: '12px' }}
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>

            {/* List of Enrolled Students */}
            {filteredEnrolledStudents.length === 0 ? (
              <p className="text-secondary text-center py-md" style={{ fontSize: '12px' }}>
                {enrolledStudents.length === 0
                  ? 'لا يوجد طلاب مسجلون في هذه المادة حالياً'
                  : 'لا يوجد طالب يطابق البحث'}
              </p>
            ) : (
              <div className="flex-col gap-xs" style={{ maxHeight: '320px', overflowY: 'auto', paddingLeft: '4px' }}>
                {filteredEnrolledStudents.map(student => {
                  const studentAtt = (student.subjectAttendance || {})[activeClass.id] || 0;
                  const isPending = actionLoading === student.id;

                  return (
                    <div
                      key={student.id}
                      className="card flex items-center justify-between"
                      style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex-col">
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{student.name}</span>
                        <div className="flex items-center gap-sm mt-xs">
                          <span className="text-secondary font-en" style={{ fontSize: '10px' }}>
                            كود: {student.studentCode || student.id.substring(0, 6)}
                          </span>
                          <span style={{ fontSize: '10px', color: studentAtt >= 30 ? 'var(--error)' : 'var(--primary)' }}>
                            الحضور: <b>{studentAtt}/30</b>
                          </span>
                        </div>
                      </div>

                      {/* Manual Attendance Action Button (Requirement 3.ب) */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '11px' }}
                        onClick={() => handleMarkManualAttendance(student.id)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <UserCheck size={13} /> تسجيل حضور
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }} className="flex items-center gap-sm">
          <Clock size={16} color="var(--primary)" /> حصص اليوم — {todayDay}
        </h3>
        {todaySchedule.length === 0 ? (
          <div className="card text-center" style={{ padding: '20px', border: '1px dashed var(--surface-container-highest)' }}>
            <p className="text-secondary" style={{ fontSize: '12px', margin: 0 }}>لا توجد حصص مجدولة لموادك اليوم</p>
          </div>
        ) : (
          todaySchedule.map((entry, i) => (
            <div key={i} className="card flex items-center gap-lg" style={{ padding: '12px 16px' }}>
              <div className="flex-col items-center gap-xs" style={{ minWidth: '60px', paddingLeft: '12px', borderLeft: '2px solid var(--primary)' }}>
                <Clock size={14} style={{ color: 'var(--primary)' }} />
                <span className="font-en" style={{ fontWeight: 700, fontSize: '13px' }}>{entry.time}</span>
              </div>
              <div className="flex-col flex-1 gap-xs">
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{entry.className}</span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>القاعة {entry.room || '—'}</span>
              </div>
              <span className="chip primary" style={{ fontSize: '10px' }}>نشط</span>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity for Teacher's Classes */}
      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }}>الطلاب الحاضرون مؤخراً في موادك</h3>
        {myTransactions.length === 0 ? (
          <p className="text-secondary text-center" style={{ fontSize: '13px', padding: '16px 0' }}>لا توجد عمليات حضور مسجلة بعد</p>
        ) : (
          myTransactions.slice(0, 5).map((t, i) => (
            <div key={i} className="card flex justify-between items-center" style={{ padding: '12px 16px' }}>
              <div className="flex-col">
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.studentName}</span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>{t.className}</span>
              </div>
              <div className="flex-col items-end">
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '13px' }}>+{(t.teacherShare || 0).toLocaleString()} DA</span>
                <span className="text-secondary font-en" style={{ fontSize: '10px' }}>
                  {t.timestamp ? new Date(t.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : '---'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Link Subject Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div className="w-full" style={{ maxWidth: '420px', position: 'relative' }}>
            <button
              className="btn-icon"
              style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}
              onClick={() => setShowLinkModal(false)}
            >
              <X size={18} />
            </button>
            <SubjectKeyInput
              compact
              title="ربط مادة أو فوج جديد"
              subtitle="أدخل رمز المادة المقدم من إدارة المدرسة"
              onSuccess={() => {
                setShowLinkModal(false);
              }}
            />
          </div>
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
