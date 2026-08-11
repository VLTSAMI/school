import { useState } from 'react';
import { UserPlus, Mail, Lock, User, Key, ArrowRight, Loader2, Phone, GraduationCap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../lib/firebase';

const LEVELS = [
  'السنة الأولى ابتدائي', 'السنة الثانية ابتدائي', 'السنة الثالثة ابتدائي', 'السنة الرابعة ابتدائي', 'السنة الخامسة ابتدائي',
  'السنة الأولى متوسط', 'السنة الثانية متوسط', 'السنة الثالثة متوسط', 'السنة الرابعة متوسط',
  'السنة الأولى ثانوي', 'السنة الثانية ثانوي', 'السنة الثالثة ثانوي (بكالوريا)',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regKey, setRegKey] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!regKey) throw new Error("يرجى إدخال مفتاح التسجيل");
      await registerUser(name, email, password, regKey.toUpperCase(), phone, level);
      localStorage.setItem('userRole', 'student');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-col justify-center" style={{ minHeight: '100vh', gap: '32px', paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="flex-col items-center gap-sm">
        <div className="btn-icon" style={{ width: '80px', height: '80px', background: 'rgba(255, 95, 31, 0.1)', color: 'var(--primary)', border: '2px solid var(--primary)' }}>
          <UserPlus size={40} />
        </div>
        <h1 style={{ margin: 0 }}>إنشاء حساب جديد</h1>
        <p className="text-secondary">انضم إلى المنظومة التعليمية</p>
      </div>

      <form className="flex-col gap-md" onSubmit={handleRegister}>
        {error && (
          <div className="card" style={{ padding: '12px', border: '1px solid var(--error)', background: 'rgba(255, 180, 171, 0.1)', color: 'var(--error)', fontSize: '14px', borderRadius: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Registration Key - Most important, shown first */}
        <div className="input-group">
          <label className="input-label">مفتاح التسجيل (Key) *</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
              <Key size={20} />
            </span>
            <input type="text" className="input-field w-full" placeholder="أدخل الكود المستلم من المدرسة"
              style={{ paddingRight: '48px', borderColor: 'var(--primary)', background: 'rgba(255, 95, 31, 0.05)' }}
              value={regKey} onChange={(e) => setRegKey(e.target.value)} required />
          </div>
          <p style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>* يجب دفع رسوم الاشتراك للحصول على المفتاح</p>
        </div>

        <div className="input-group">
          <label className="input-label">الاسم الكامل *</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
              <User size={20} />
            </span>
            <input type="text" className="input-field w-full" placeholder="أدخل اسمك الثلاثي"
              style={{ paddingRight: '48px' }} value={name}
              onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">رقم الهاتف</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
              <Phone size={20} />
            </span>
            <input type="tel" className="input-field w-full" placeholder="0555 00 00 00"
              style={{ paddingRight: '48px' }} value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">المستوى الدراسي</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
              <GraduationCap size={20} />
            </span>
            <select className="input-field w-full" value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{ paddingRight: '48px', background: 'rgba(0,0,0,0.2)' }}>
              <option value="">-- اختر مستواك --</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">البريد الإلكتروني *</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
              <Mail size={20} />
            </span>
            <input type="email" className="input-field w-full" placeholder="example@mail.com"
              style={{ paddingRight: '48px' }} value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">كلمة السر *</label>
          <div className="relative">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
              <Lock size={20} />
            </span>
            <input type="password" className="input-field w-full" placeholder="••••••••"
              style={{ paddingRight: '48px' }} value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
        </div>

        <button className="btn btn-primary w-full" disabled={loading} style={{ height: '56px', marginTop: '8px' }}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>إنشاء الحساب <ArrowRight size={20} style={{ marginRight: '8px' }} /></>
          )}
        </button>

        <p className="text-center text-secondary" style={{ fontSize: '14px' }}>
          لديك حساب بالفعل؟ <Link to="/login" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>سجل دخولك</Link>
        </p>
      </form>
    </div>
  );
}
