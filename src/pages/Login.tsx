import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { loginUser, sendPasswordResetEmail } from '../lib/firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await loginUser(email, password);
      localStorage.setItem('userRole', role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message === "Firebase: Error (auth/invalid-credential)."
        ? "البريد أو كلمة السر غير صحيحة"
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError('لم يتم العثور على هذا البريد الإلكتروني');
    } finally {
      setResetLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="container min-h-screen flex-col items-center justify-center gap-xl">
        <div className="text-center w-full">
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,95,31,0.1)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mail size={28} color="var(--primary)" />
          </div>
          <h1 className="mb-sm">استعادة كلمة السر</h1>
          <p className="text-secondary">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        {resetSent ? (
          <div className="card w-full text-center" style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.3)', padding: '24px' }}>
            <p style={{ color: '#4ade80', fontWeight: 600 }}>✅ تم إرسال رابط الاستعادة!</p>
            <p className="text-secondary" style={{ fontSize: '13px', marginTop: '8px' }}>تحقق من بريدك الإلكتروني واتبع التعليمات.</p>
          </div>
        ) : (
          <form className="w-full flex-col gap-lg" onSubmit={handlePasswordReset}>
            {error && (
              <div className="card" style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid var(--error)', padding: '12px' }}>
                <p style={{ color: 'var(--error)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {error}
                </p>
              </div>
            )}
            <div className="flex-col gap-sm">
              <label className="input-label">البريد الإلكتروني</label>
              <div className="relative w-full">
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Mail size={20} className="text-secondary" />
                </span>
                <input type="email" className="input-field w-full" placeholder="name@school.com"
                  style={{ paddingRight: '48px' }} value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={resetLoading}>
              {resetLoading ? <Loader2 className="animate-spin" size={18} /> : 'إرسال رابط الاستعادة'}
            </button>
          </form>
        )}

        <button className="btn-ghost" onClick={() => { setResetMode(false); setError(''); setResetSent(false); }}>
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <div className="container min-h-screen flex-col items-center justify-center gap-xl">
      <div className="text-center w-full">
        <h1 className="mb-sm">مرحباً بك مجدداً</h1>
        <p className="text-secondary">سجل دخولك لمتابعة رحلتك التعليمية</p>
      </div>

      <form className="w-full flex-col gap-lg" onSubmit={handleLogin}>
        {error && (
          <div className="card" style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid var(--error)', padding: '12px' }}>
            <p style={{ color: 'var(--error)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </p>
          </div>
        )}

        <div className="flex-col gap-sm">
          <label className="input-label">البريد الإلكتروني</label>
          <div className="relative w-full">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <User size={20} className="text-secondary" />
            </span>
            <input type="email" className="input-field w-full" placeholder="name@school.com"
              style={{ paddingRight: '48px' }} value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="flex-col gap-sm">
          <label className="input-label">كلمة السر</label>
          <div className="relative w-full">
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <Lock size={20} className="text-secondary" />
            </span>
            <input type="password" className="input-field w-full" placeholder="••••••••"
              style={{ paddingRight: '48px' }} value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn-ghost text-secondary" style={{ fontSize: '13px' }}
            onClick={() => { setResetMode(true); setError(''); }}>
            نسيت كلمة السر؟
          </button>
        </div>

        <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-sm" disabled={loading}>
          {loading ? 'جاري التحقق...' : (
            <>تسجيل الدخول <ArrowRight size={20} /></>
          )}
        </button>
      </form>

      <p className="text-secondary" style={{ fontSize: '14px' }}>
        ليس لديك حساب؟{' '}
        <button type="button"
          onClick={() => navigate('/register')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', fontSize: '14px', padding: 0 }}>
          أنشئ حساباً جديداً
        </button>
      </p>
    </div>
  );
}
