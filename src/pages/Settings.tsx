import { useState, useEffect } from 'react';
import { User, Phone, GraduationCap, Save, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { auth, logoutUser, subscribeToCollection, updateStudentProfile } from '../lib/firebase';

const LEVELS = [
  'السنة الأولى ابتدائي', 'السنة الثانية ابتدائي', 'السنة الثالثة ابتدائي', 'السنة الرابعة ابتدائي', 'السنة الخامسة ابتدائي',
  'السنة الأولى متوسط', 'السنة الثانية متوسط', 'السنة الثالثة متوسط', 'السنة الرابعة متوسط',
  'السنة الأولى ثانوي', 'السنة الثانية ثانوي', 'السنة الثالثة ثانوي (بكالوريا)',
];

export default function Settings() {
  const role = localStorage.getItem('userRole') || 'student';
  const uid = auth.currentUser?.uid;
  const [studentData, setStudentData] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!uid || role !== 'student') { setLoading(false); return; }
    const unsub = subscribeToCollection('students', (data: any[]) => {
      const me = data.find(s => s.id === uid);
      if (me) {
        setStudentData(me);
        setName(me.name || '');
        setPhone(me.phone || '');
        setLevel(me.level || '');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid, role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      await updateStudentProfile(uid, { name, phone, level });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="container flex-col gap-lg">
      <h2 className="flex items-center gap-sm mt-sm">
        <User color="var(--primary)" /> الإعدادات والملف الشخصي
      </h2>

      {/* Profile Avatar */}
      <div className="flex-col items-center gap-md">
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,95,31,0.15)', border: '2px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <User size={36} color="var(--primary)" />
        </div>
        <div className="flex-col items-center gap-xs">
          <span style={{ fontWeight: 700, fontSize: '18px' }}>{name || 'المستخدم'}</span>
          <span className="chip primary" style={{ fontSize: '11px' }}>
            {role === 'admin' ? '🛡️ مدير' : role === 'teacher' ? '📚 أستاذ' : '🎓 طالب'}
          </span>
          {studentData?.studentCode && (
            <span className="text-secondary number" style={{ fontSize: '12px', letterSpacing: '2px' }}>{studentData.studentCode}</span>
          )}
        </div>
      </div>

      {/* Edit Form (Student Only) */}
      {role === 'student' && (
        <form onSubmit={handleSave} className="flex-col gap-md">
          <div className="card flex-col gap-md">
            <h3 style={{ margin: 0, fontSize: '15px' }}>تعديل البيانات الشخصية</h3>

            <div className="flex-col gap-xs">
              <label className="input-label">الاسم الكامل</label>
              <div className="relative w-full">
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <User size={18} className="text-secondary" />
                </span>
                <input type="text" className="input-field w-full" placeholder="أدخل اسمك الكامل"
                  style={{ paddingRight: '48px' }} value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>

            <div className="flex-col gap-xs">
              <label className="input-label">رقم الهاتف</label>
              <div className="relative w-full">
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Phone size={18} className="text-secondary" />
                </span>
                <input type="tel" className="input-field w-full" placeholder="0555 00 00 00"
                  style={{ paddingRight: '48px' }} value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="flex-col gap-xs">
              <label className="input-label">المستوى الدراسي</label>
              <div className="relative w-full">
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <GraduationCap size={18} className="text-secondary" />
                </span>
                <select className="input-field w-full" value={level} onChange={e => setLevel(e.target.value)}
                  style={{ paddingRight: '48px', background: 'rgba(0,0,0,0.2)' }}>
                  <option value="">-- اختر مستواك الدراسي --</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ ✅' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      )}

      {/* Account Info */}
      <div className="card flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }}>معلومات الحساب</h3>
        <div className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-secondary" style={{ fontSize: '13px' }}>البريد الإلكتروني</span>
          <span style={{ fontSize: '13px' }}>{auth.currentUser?.email || '—'}</span>
        </div>
        <div className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-secondary" style={{ fontSize: '13px' }}>الدور</span>
          <span style={{ fontSize: '13px' }}>{role === 'admin' ? 'مدير' : role === 'teacher' ? 'أستاذ' : 'طالب'}</span>
        </div>
        {studentData?.joinedAt && (
          <div className="flex justify-between items-center" style={{ padding: '8px 0' }}>
            <span className="text-secondary" style={{ fontSize: '13px' }}>تاريخ الانضمام</span>
            <span style={{ fontSize: '13px' }}>
              {new Date(studentData.joinedAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        className="btn w-full"
        style={{ background: 'rgba(255,77,77,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '16px' }}
        onClick={logoutUser}
      >
        <LogOut size={18} /> تسجيل الخروج
      </button>

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
