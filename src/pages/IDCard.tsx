import { useState, useEffect } from 'react';
import { CreditCard, Download, ShieldCheck, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { subscribeToCollection, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function IDCard() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToCollection('students', (data: any[]) => {
      const myData = data.find(s => s.id === uid);
      setStudent(myData || null);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  if (loading) return (
    <div className="container py-xl text-center flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="mt-md text-secondary">جاري تجهيز بطاقتك...</p>
    </div>
  );

  if (!uid || !student) return (
    <div className="container py-xl text-center flex-col items-center gap-lg">
      <div className="card flex-col items-center gap-md py-xl">
        <AlertCircle size={64} color="var(--error)" style={{ opacity: 0.5 }} />
        <h3>لم يتم العثور على حساب طالب</h3>
        <p className="text-secondary" style={{ fontSize: '14px' }}>يجب عليك تسجيل الدخول بحساب طالب لتتمكن من رؤية هويتك.</p>
        <button className="btn btn-primary w-full" onClick={() => navigate('/login')}>
          <LogIn size={20} /> سجل دخولك الآن
        </button>
      </div>
    </div>
  );

  const isExpired = student.paymentStatus === 'expired';
  
  const studentId = student.id || uid;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${studentId}&bgcolor=ffffff&color=000000&margin=1`;

  return (
    <div className="container flex-col gap-lg">
      <h2 className="flex items-center gap-sm mt-sm">
        <CreditCard color="var(--primary)" /> بطاقة هوية الطالب
      </h2>

      <div className="card flex-col gap-lg" style={{ 
        background: isExpired ? 'linear-gradient(135deg, #2a1a1a, #1a1111)' : 'linear-gradient(135deg, #1a1a1a, #131313)',
        border: isExpired ? '2px solid var(--error)' : '1px solid var(--surface-container-highest)',
        boxShadow: isExpired ? '0 0 20px rgba(255, 180, 171, 0.2)' : 'var(--glow-primary)',
        padding: '32px'
      }}>
        
        <div className="flex justify-between items-start">
          <div className="flex-col gap-xs">
            <h2 style={{ margin: 0, fontSize: '24px' }}>{student.name}</h2>
            <span className="text-secondary font-en" style={{ fontSize: '14px', letterSpacing: '2px' }}>{student.studentCode || 'STU-NEW'}</span>
          </div>
          <div className={`chip ${isExpired ? 'error' : 'primary'}`} style={{ 
            background: isExpired ? 'rgba(255, 180, 171, 0.1)' : 'rgba(255, 95, 31, 0.1)',
            color: isExpired ? 'var(--error)' : 'var(--primary)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isExpired ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
            {isExpired ? 'عـاطل (منتهي)' : 'نشط (مدفوع)'}
          </div>
        </div>

        <div className="flex justify-center p-md" style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          <img 
            src={qrUrl} 
            alt="QR Code" 
            style={{ width: '200px', height: '200px', display: 'block' }}
          />
        </div>

        {/* Attendance Counter removed from ID Card as per request */}

        {isExpired && (
          <div className="flex items-center gap-sm" style={{ color: 'var(--error)', fontSize: '12px', background: 'rgba(255, 180, 171, 0.05)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--error)' }}>
            <AlertCircle size={16} />
            <span>لقد انتهى اشتراكك الشهري. يرجى التوجه للإدارة لتجديد الدفع.</span>
          </div>
        )}
      </div>

      <button className="btn btn-secondary w-full" style={{ borderRadius: '16px' }}>
        <Download size={20} /> تحميل البطاقة كصورة
      </button>
      <div style={{ height: '80px' }}></div>
    </div>
  );
}
