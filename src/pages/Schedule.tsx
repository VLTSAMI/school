import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { subscribeToCollection, addScheduleEntry, deleteScheduleEntry, auth } from '../lib/firebase';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function Schedule() {
  const role = localStorage.getItem('userRole') || 'student';
  const uid = auth.currentUser?.uid;
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal form
  const [formClass, setFormClass] = useState('');
  const [formDay, setFormDay] = useState(DAYS[0]);
  const [formTime, setFormTime] = useState('08:00');
  const [formRoom, setFormRoom] = useState('');

  useEffect(() => {
    let done = 0;
    const check = () => { done++; if (done >= 3) setLoading(false); };
    const u1 = subscribeToCollection('schedule', (data: any[]) => { setSchedule(data); check(); });
    const u2 = subscribeToCollection('classes', (data: any[]) => { setClasses(data); check(); });
    const u3 = subscribeToCollection('students', (data: any[]) => { setStudents(data.filter(s => s.name)); check(); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const getVisibleSchedule = () => {
    if (role === 'admin') {
      return schedule.filter(e => e.day === selectedDay);
    }
    if (role === 'teacher') {
      return schedule.filter(e => e.day === selectedDay && (e.teacherId === uid || !e.teacherId));
    }
    // Student: show only their enrolled classes
    const myData = students.find(s => s.id === uid);
    const myClassIds = myData?.classIds || [];
    return schedule.filter(e => e.day === selectedDay && myClassIds.includes(e.classId));
  };

  const daySchedule = getVisibleSchedule().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classes.find(c => c.id === formClass);
    if (!selectedClass) return;
    setActionLoading(true);
    try {
      await addScheduleEntry({
        classId: formClass,
        className: selectedClass.name,
        teacher: selectedClass.teacher,
        teacherId: selectedClass.teacherId || '',
        day: formDay,
        time: formTime,
        room: formRoom,
      });
      setShowModal(false);
      setFormClass(''); setFormRoom(''); setFormTime('08:00'); setFormDay(DAYS[0]);
    } catch {
      alert('خطأ في إضافة الحصة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذه الحصة من الجدول؟')) return;
    await deleteScheduleEntry(id);
  };

  if (loading) return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="container flex-col gap-lg">
      <div className="flex justify-between items-center mt-sm">
        <h2 className="flex items-center gap-sm" style={{ margin: 0 }}>
          <Calendar color="var(--primary)" /> جدول الحصص
        </h2>
        {(role === 'admin' || role === 'teacher') && (
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '13px' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> إضافة حصة
          </button>
        )}
      </div>

      {/* Day Tabs */}
      <div className="flex gap-sm" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        {DAYS.map(day => (
          <button
            key={day}
            className={`btn ${selectedDay === day ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 18px', flexShrink: 0, borderRadius: '12px', fontSize: '13px' }}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Entries */}
      <div className="flex-col gap-sm">
        {daySchedule.length === 0 ? (
          <div className="card flex-col items-center py-xl gap-md" style={{ border: '1px dashed var(--surface-container-highest)' }}>
            <Calendar size={48} style={{ opacity: 0.2 }} />
            <p className="text-secondary text-center" style={{ margin: 0, fontSize: '14px' }}>لا توجد حصص مجدولة ليوم {selectedDay}</p>
            {(role === 'admin' || role === 'teacher') && (
              <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '12px' }} onClick={() => setShowModal(true)}>
                <Plus size={14} /> إضافة حصة
              </button>
            )}
          </div>
        ) : (
          daySchedule.map((entry) => (
            <div key={entry.id} className="card flex items-center gap-md" style={{ padding: '16px 20px' }}>
              {/* Time */}
              <div className="flex-col items-center gap-xs" style={{
                minWidth: '64px', paddingLeft: '16px',
                borderLeft: '2px solid var(--primary)', textAlign: 'center'
              }}>
                <Clock size={14} style={{ color: 'var(--primary)' }} />
                <span className="font-en" style={{ fontWeight: 700, fontSize: '14px' }}>{entry.time}</span>
              </div>
              {/* Info */}
              <div className="flex-col gap-xs flex-1">
                <h4 style={{ margin: 0, fontSize: '15px' }}>{entry.className}</h4>
                <div className="flex items-center gap-md">
                  <span className="text-secondary flex items-center gap-xs" style={{ fontSize: '11px' }}>
                    <BookOpen size={12} /> أ. {entry.teacher}
                  </span>
                  {entry.room && (
                    <span className="text-secondary" style={{ fontSize: '11px' }}>القاعة {entry.room}</span>
                  )}
                </div>
              </div>
              {/* Delete (admin/teacher) */}
              {(role === 'admin' || role === 'teacher') && (
                <button className="btn-icon" style={{ width: '32px', height: '32px', color: 'var(--error)', background: 'rgba(255,77,77,0.08)' }}
                  onClick={() => handleDelete(entry.id)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card w-full flex-col gap-md" style={{ maxWidth: '420px', background: 'var(--surface-bright)' }}>
            <div className="flex justify-between items-center">
              <h3 style={{ margin: 0 }}>إضافة حصة جديدة</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAdd} className="flex-col gap-md">
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>المادة</label>
                <select className="input-field w-full" value={formClass} onChange={e => setFormClass(e.target.value)} required
                  style={{ background: 'var(--surface)', padding: '12px 16px' }}>
                  <option value="">-- اختر المادة --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — أ. {c.teacher}</option>)}
                </select>
              </div>
              <div className="flex gap-sm">
                <div className="flex-col gap-xs flex-1">
                  <label style={{ fontSize: '12px' }}>اليوم</label>
                  <select className="input-field w-full" value={formDay} onChange={e => setFormDay(e.target.value)}
                    style={{ background: 'var(--surface)', padding: '12px 16px' }}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex-col gap-xs" style={{ width: '110px' }}>
                  <label style={{ fontSize: '12px' }}>الوقت</label>
                  <input type="time" className="input-field w-full" value={formTime}
                    onChange={e => setFormTime(e.target.value)} style={{ padding: '12px 10px' }} />
                </div>
              </div>
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>رقم القاعة (اختياري)</label>
                <input type="text" className="input-field w-full" placeholder="مثال: 3" value={formRoom}
                  onChange={e => setFormRoom(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={actionLoading}>
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                إضافة للجدول
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
