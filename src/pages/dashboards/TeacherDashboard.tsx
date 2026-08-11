import { useState, useEffect } from 'react';
import { BookOpen, Wallet, Clock, LogOut, Users, TrendingUp, Loader2 } from 'lucide-react';
import { logoutUser, subscribeToCollection, auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface TeacherDashboardProps {
  transactions: any[];
}

export default function TeacherDashboard({ transactions }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    let done = 0;
    const check = () => { done++; if (done >= 3) setLoading(false); };
    const u1 = subscribeToCollection('classes', (data: any[]) => { setClasses(data); check(); });
    const u2 = subscribeToCollection('students', (data: any[]) => { setStudents(data.filter(s => s.name)); check(); });
    const u3 = subscribeToCollection('schedule', (data: any[]) => { setSchedule(data); check(); });
    return () => { u1(); u2(); u3(); };
  }, []);

  // Filter by teacher
  const myClasses = classes.filter(c => c.teacherId === uid || !c.teacherId);
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

  const todaySchedule = schedule.filter(s =>
    s.day === todayDay && myClasses.some(c => c.id === s.classId)
  ).sort((a, b) => a.time?.localeCompare(b.time));

  if (loading) return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="container flex-col gap-lg">
      <div className="flex justify-between items-center mt-sm">
        <div className="flex-col">
          <h1 style={{ margin: 0, fontSize: '22px' }}>لوحة الأستاذ</h1>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <button className="btn-icon" onClick={logoutUser}><LogOut size={20} /></button>
      </div>

      {/* Revenue Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card flex-col gap-xs" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255,95,31,0.12), rgba(255,95,31,0.04))' }}>
          <Wallet size={20} color="var(--primary)" />
          <span className="text-secondary" style={{ fontSize: '11px' }}>مستحقات اليوم</span>
          <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: 'var(--primary)' }}>
            {todayRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small>
          </span>
        </div>
        <div className="card flex-col gap-xs" style={{ padding: '16px' }}>
          <TrendingUp size={20} color="#60a5fa" />
          <span className="text-secondary" style={{ fontSize: '11px' }}>مستحقات الشهر</span>
          <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: '#60a5fa' }}>
            {monthRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small>
          </span>
        </div>
      </div>

      {/* My Classes */}
      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }} className="flex items-center gap-sm">
          <BookOpen size={16} color="var(--primary)" /> موادي ({myClasses.length})
        </h3>
        {myClasses.length === 0 ? (
          <p className="text-secondary text-center" style={{ fontSize: '13px', padding: '20px 0' }}>لم يتم تعيينك في أي مادة بعد</p>
        ) : (
          myClasses.map(cls => {
            const classStudents = students.filter(s => (s.classIds || []).includes(cls.id));
            const classEarnings = myTransactions
              .filter(t => t.classId === cls.id)
              .reduce((sum, t) => sum + (t.teacherShare || 0), 0);
            return (
              <div key={cls.id} className="card flex items-center justify-between" style={{ padding: '14px 18px' }}>
                <div className="flex-col gap-xs">
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{cls.name}</span>
                  <div className="flex items-center gap-md">
                    <span className="text-secondary flex items-center gap-xs" style={{ fontSize: '11px' }}>
                      <Users size={12} /> {classStudents.length} طالب
                    </span>
                    <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>
                      {classEarnings.toLocaleString()} DA
                    </span>
                  </div>
                </div>
                <span className="chip primary" style={{ fontSize: '11px' }}>{cls.fee} DA/حصة</span>
              </div>
            );
          })
        )}
      </div>

      {/* Today's Schedule */}
      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }} className="flex items-center gap-sm">
          <Clock size={16} color="var(--primary)" /> حصص اليوم — {todayDay}
        </h3>
        {todaySchedule.length === 0 ? (
          <div className="card text-center" style={{ padding: '24px', border: '1px dashed var(--surface-container-highest)' }}>
            <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>لا توجد حصص مجدولة اليوم</p>
            <button className="btn btn-secondary mt-sm" style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }} onClick={() => navigate('/schedule')}>
              إدارة الجدول
            </button>
          </div>
        ) : (
          todaySchedule.map((entry, i) => (
            <div key={i} className="card flex items-center gap-lg" style={{ padding: '14px 18px' }}>
              <div className="flex-col items-center gap-xs" style={{ minWidth: '60px', paddingLeft: '12px', borderLeft: '2px solid var(--primary)' }}>
                <Clock size={14} style={{ color: 'var(--primary)' }} />
                <span className="font-en" style={{ fontWeight: 700, fontSize: '14px' }}>{entry.time}</span>
              </div>
              <div className="flex-col flex-1 gap-xs">
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{entry.className}</span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>القاعة {entry.room || '—'}</span>
              </div>
              <span className="chip primary" style={{ fontSize: '10px' }}>نشط</span>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }}>الطلاب الحاضرون مؤخراً</h3>
        {myTransactions.length === 0 ? (
          <p className="text-secondary text-center" style={{ fontSize: '13px', padding: '20px 0' }}>لا توجد معاملات بعد</p>
        ) : (
          myTransactions.slice(0, 5).map((t, i) => (
            <div key={i} className="card flex justify-between items-center" style={{ padding: '12px 16px' }}>
              <div className="flex-col">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.studentName}</span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>{t.className}</span>
              </div>
              <div className="flex-col items-end">
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '13px' }}>+{(t.teacherShare || 0).toLocaleString()} DA</span>
                <span className="text-secondary" style={{ fontSize: '10px' }}>
                  {t.timestamp ? new Date(t.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : '---'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ height: '80px' }}></div>
    </div>
  );
}
