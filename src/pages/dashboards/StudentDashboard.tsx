import { useState, useEffect } from 'react';
import { BookOpen, ScanLine, Bell, LogOut, Loader2, ChevronRight, AlertTriangle, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, subscribeToCollection, auth } from '../../lib/firebase';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const unsubStudents = subscribeToCollection('students', (data: any[]) => {
      const myData = data.find(s => s.id === uid);
      if (myData) setStudentData(myData);
    });

    const unsubClasses = subscribeToCollection('classes', (data: any[]) => {
      setClasses(data);
      setLoading(false);
    });

    return () => { unsubStudents(); unsubClasses(); };
  }, [uid]);

  if (loading) {
    return (
      <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const displayName = studentData?.name || "أيها التلميذ";
  const myClassIds = studentData?.classIds || [];
  const mySubjectAttendance = studentData?.subjectAttendance || {};

  // Build notifications
  const notifications: { msg: string; type: 'danger' | 'warning' }[] = [];
  myClassIds.forEach((cid: string) => {
    const count = mySubjectAttendance[cid] || 0;
    const cls = classes.find(c => c.id === cid);
    const name = cls?.name || 'مادة';
    if (count >= 30) notifications.push({ msg: `انتهى اشتراكك في مادة ${name} — يرجى التجديد`, type: 'danger' });
    else if (count >= 25) notifications.push({ msg: `تبقّى لك ${30 - count} حصص فقط في ${name}`, type: 'warning' });
  });

  return (
    <div className="container flex-col gap-lg">
      {/* Notification Panel */}
      {showNotifications && notifications.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px 20px' }}
          onClick={() => setShowNotifications(false)}>
          <div className="card w-full flex-col gap-sm" style={{ maxWidth: '400px', background: 'var(--surface-bright)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>الإشعارات</h3>
            {notifications.map((n, i) => (
              <div key={i} className="flex items-start gap-sm" style={{
                padding: '12px', borderRadius: '12px',
                background: n.type === 'danger' ? 'rgba(255,77,77,0.08)' : 'rgba(250,204,21,0.08)',
                border: `1px solid ${n.type === 'danger' ? 'rgba(255,77,77,0.3)' : 'rgba(250,204,21,0.3)'}`
              }}>
                <AlertTriangle size={16} style={{ color: n.type === 'danger' ? 'var(--error)' : '#facc15', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: n.type === 'danger' ? 'var(--error)' : '#facc15' }}>{n.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mt-sm">
        <div className="flex-col">
          <h1 style={{ margin: 0, fontSize: '22px' }}>أهلاً {displayName.split(' ')[0]} 👋</h1>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="flex gap-sm">
          <button className="btn-icon" style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'var(--error)', fontSize: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#fff'
              }}>{notifications.length}</span>
            )}
          </button>
          <button className="btn-icon" onClick={logoutUser}><LogOut size={20} /></button>
        </div>
      </div>

      {/* Student Info */}
      {studentData && (
        <div className="card flex items-center gap-md" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(255,95,31,0.08), rgba(255,95,31,0.02))' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,95,31,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={24} color="var(--primary)" />
          </div>
          <div className="flex-col gap-xs flex-1">
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{studentData.name}</span>
            <div className="flex gap-sm flex-wrap">
              {studentData.level && <span className="chip primary" style={{ fontSize: '10px' }}>{studentData.level}</span>}
              {studentData.studentCode && <span className="text-secondary number" style={{ fontSize: '11px', letterSpacing: '1px' }}>{studentData.studentCode}</span>}
            </div>
          </div>
          <button onClick={() => navigate('/idcard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight size={18} className="text-secondary" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      )}

      {/* Subscription Status */}
      <h3 style={{ margin: '4px 0 -4px', fontSize: '15px' }}>حالة اشتراكاتك</h3>

      {myClassIds.length === 0 ? (
        <div className="card flex-col items-center py-xl gap-md" style={{ border: '1px dashed var(--surface-container-highest)' }}>
          <p className="text-secondary text-center">أنت غير مسجل في أي مادة حالياً</p>
          <button className="btn btn-secondary" onClick={() => navigate('/classes')}>سجل في المواد</button>
        </div>
      ) : (
        <div className="flex-col gap-md">
          {myClassIds.map((cid: string) => {
            const classInfo = classes.find(c => c.id === cid);
            const count = mySubjectAttendance[cid] || 0;
            const isExpired = count >= 30;
            const isWarning = count >= 25 && !isExpired;
            const percentage = Math.min((count / 30) * 100, 100);
            const barColor = isExpired ? 'var(--error)' : isWarning ? '#facc15' : 'var(--primary)';

            return (
              <div key={cid} className="card flex-col gap-sm" style={{
                background: isExpired ? 'linear-gradient(135deg, #2a1a1a, #1a1111)' : 'linear-gradient(135deg, var(--surface-bright), var(--surface))',
                border: `1px solid ${isExpired ? 'rgba(255,77,77,0.4)' : isWarning ? 'rgba(250,204,21,0.3)' : 'var(--surface-container-highest)'}`,
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex-col">
                    <h4 style={{ margin: 0 }}>{classInfo?.name || 'مادة غير معروفة'}</h4>
                    <span className="text-secondary" style={{ fontSize: '11px' }}>أ. {classInfo?.teacher}</span>
                  </div>
                  <div className="flex-col items-end">
                    <span dir="ltr" className="font-en" style={{ fontWeight: 700, fontSize: '18px', color: barColor }}>
                      {count} / 30
                    </span>
                    <span style={{ fontSize: '10px', color: barColor, opacity: 0.8 }}>حصة</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: barColor,
                    boxShadow: `0 0 8px ${barColor}`,
                    transition: 'width 1s ease'
                  }} />
                </div>

                {isExpired && (
                  <div className="flex items-center gap-xs" style={{ color: 'var(--error)', fontSize: '11px', background: 'rgba(255,77,77,0.06)', padding: '8px 12px', borderRadius: '10px', border: '1px dashed rgba(255,77,77,0.3)' }}>
                    <AlertTriangle size={13} />
                    <span>انتهى اشتراكك — توجّه للإدارة لتجديد الدفع</span>
                  </div>
                )}
                {isWarning && (
                  <div className="flex items-center gap-xs" style={{ color: '#facc15', fontSize: '11px', background: 'rgba(250,204,21,0.05)', padding: '8px 12px', borderRadius: '10px', border: '1px dashed rgba(250,204,21,0.25)' }}>
                    <AlertTriangle size={13} />
                    <span>تبقّى {30 - count} حصص فقط</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'المواد', icon: BookOpen, path: '/classes', color: 'var(--primary)' },
          { label: 'الجدول', icon: Calendar, path: '/schedule', color: '#60a5fa' },
          { label: 'بطاقتي', icon: ScanLine, path: '/idcard', color: '#a78bfa' },
        ].map(item => (
          <div key={item.path} className="card flex-col items-center gap-sm" onClick={() => navigate(item.path)}
            style={{ cursor: 'pointer', padding: '18px 10px' }}>
            <div className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: item.color, width: '40px', height: '40px' }}>
              <item.icon size={20} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '12px' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ height: '40px' }}></div>
    </div>
  );
}
