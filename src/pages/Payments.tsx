import { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, PlusCircle, Loader2, Filter, X, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { subscribeToCollection, resetStudentAttendance, addManualTransaction } from '../lib/firebase';

export default function Payments() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Manual payment modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStudent, setManualStudent] = useState('');
  const [manualClass, setManualClass] = useState('');

  useEffect(() => {
    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 3) setLoading(false); };
    const u1 = subscribeToCollection('transactions', (data: any[]) => {
      setTransactions(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      checkDone();
    });
    const u2 = subscribeToCollection('students', (data: any[]) => { setStudents(data.filter(s => s.name)); checkDone(); });
    const u3 = subscribeToCollection('classes', (data: any[]) => { setClasses(data); checkDone(); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReset = async (studentId: string, studentName: string, classId: string, className: string) => {
    if (!window.confirm(`تجديد اشتراك "${studentName}" في مادة "${className}"؟\nسيتم إعادة العداد إلى صفر.`)) return;
    setActionLoading(`${studentId}-${classId}`);
    try {
      await resetStudentAttendance(studentId, classId);
      showToast(`✅ تم تجديد اشتراك ${studentName} في ${className}`, true);
    } catch {
      showToast('❌ حدث خطأ في التجديد', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudent || !manualClass) return;
    setActionLoading('manual');
    try {
      await addManualTransaction(manualStudent, manualClass, students, classes);
      const s = students.find(s => s.id === manualStudent);
      const c = classes.find(c => c.id === manualClass);
      showToast(`✅ تم تسجيل حضور ${s?.name} في ${c?.name}`, true);
      setShowManualModal(false);
      setManualStudent(''); setManualClass('');
    } catch (err: any) {
      showToast(`❌ ${err.message}`, false);
    } finally {
      setActionLoading(null);
    }
  };

  // Expired subscriptions for quick renewal
  const expiredStudents = students.flatMap(s => {
    const attendance = s.subjectAttendance || {};
    const expiredClasses = Object.entries(attendance)
      .filter(([, count]: any) => count >= 30)
      .map(([classId]) => ({
        student: s,
        classId,
        className: classes.find(c => c.id === classId)?.name || classId
      }));
    return expiredClasses;
  });

  const filtered = transactions.filter(t => {
    const matchSearch = (t.studentName || '').includes(searchTerm) || (t.className || '').includes(searchTerm);
    const matchClass = filterClass === 'all' || t.classId === filterClass;
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchClass && matchType;
  });

  const typeLabel: Record<string, string> = {
    scan: '📷 مسح QR',
    manual: '✋ يدوي',
    renewal: '🔄 تجديد',
  };

  if (loading) return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="container flex-col gap-lg">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,77,77,0.15)',
          border: `1px solid ${toast.ok ? '#4ade80' : '#ff4d4d'}`,
          color: toast.ok ? '#4ade80' : '#ff4d4d',
          padding: '12px 24px', borderRadius: '16px', zIndex: 999,
          fontSize: '14px', fontWeight: 600, backdropFilter: 'blur(12px)'
        }}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center mt-sm">
        <h2 className="flex items-center gap-sm" style={{ margin: 0 }}>
          <CreditCard color="var(--primary)" /> المدفوعات
        </h2>
        <button
          className="btn btn-primary"
          style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '13px' }}
          onClick={() => setShowManualModal(true)}
        >
          <PlusCircle size={16} /> تسجيل يدوي
        </button>
      </div>

      {/* Expired Subscriptions Quick Panel */}
      {expiredStudents.length > 0 && (
        <div className="flex-col gap-sm">
          <h3 className="mb-xs flex items-center gap-sm" style={{ color: 'var(--error)', fontSize: '15px' }}>
            <AlertCircle size={16} /> اشتراكات منتهية — تحتاج تجديد
          </h3>
          <div className="flex-col gap-xs">
            {expiredStudents.slice(0, 5).map(({ student, classId, className }) => (
              <div key={`${student.id}-${classId}`} className="card flex items-center justify-between" style={{ padding: '12px 16px', background: 'rgba(255,77,77,0.06)', borderColor: 'rgba(255,77,77,0.2)' }}>
                <div className="flex-col">
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{student.name}</span>
                  <span className="text-secondary" style={{ fontSize: '11px' }}>{className} — 30/30 حصة</span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                  onClick={() => handleReset(student.id, student.name, classId, className)}
                  disabled={actionLoading === `${student.id}-${classId}`}
                >
                  {actionLoading === `${student.id}-${classId}` ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  تجديد
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex-col gap-sm">
        <div className="relative w-full">
          <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <Search size={18} className="text-secondary" />
          </span>
          <input
            type="text"
            className="input-field w-full"
            placeholder="ابحث عن طالب أو مادة..."
            style={{ paddingRight: '48px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-sm">
          <select
            className="input-field flex-1"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            style={{ padding: '10px 14px', fontSize: '13px' }}
          >
            <option value="all">جميع المواد</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="input-field flex-1"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', fontSize: '13px' }}
          >
            <option value="all">جميع الأنواع</option>
            <option value="scan">مسح QR</option>
            <option value="manual">يدوي</option>
            <option value="renewal">تجديد</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-col gap-sm">
        <div className="flex justify-between items-center">
          <h3 style={{ margin: 0, fontSize: '15px' }}>سجل المعاملات</h3>
          <span className="text-secondary" style={{ fontSize: '12px' }}>{filtered.length} معاملة</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '40px 0', fontSize: '14px' }}>لا توجد معاملات</p>
        ) : (
          filtered.map((t, i) => (
            <div key={i} className="card flex items-center justify-between" style={{ padding: '14px 18px' }}>
              <div className="flex items-center gap-sm">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.type === 'renewal' ? '#60a5fa' : t.type === 'manual' ? '#facc15' : 'var(--primary)', flexShrink: 0 }} />
                <div className="flex-col">
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.studentName}</span>
                  <span className="text-secondary" style={{ fontSize: '11px' }}>{t.className} · {typeLabel[t.type] || t.type}</span>
                </div>
              </div>
              <div className="flex-col items-end">
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '13px' }}>+{(t.adminShare || 0).toLocaleString()} DA</span>
                <span className="text-secondary" style={{ fontSize: '10px' }}>
                  {t.timestamp ? new Date(t.timestamp).toLocaleString('ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Payment Modal */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card w-full flex-col gap-md" style={{ maxWidth: '400px', background: 'var(--surface-bright)' }}>
            <div className="flex justify-between items-center">
              <h3 style={{ margin: 0 }}>تسجيل حضور يدوي</h3>
              <button className="btn-icon" onClick={() => setShowManualModal(false)}><X /></button>
            </div>
            <form onSubmit={handleManualPayment} className="flex-col gap-md">
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>اختر الطالب</label>
                <select
                  className="input-field w-full"
                  value={manualStudent}
                  onChange={e => setManualStudent(e.target.value)}
                  required
                  style={{ background: 'var(--surface)', padding: '12px 16px' }}
                >
                  <option value="">-- اختر طالباً --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>اختر المادة</label>
                <select
                  className="input-field w-full"
                  value={manualClass}
                  onChange={e => setManualClass(e.target.value)}
                  required
                  style={{ background: 'var(--surface)', padding: '12px 16px' }}
                >
                  <option value="">-- اختر مادة --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.fee} DA</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={actionLoading === 'manual'}>
                {actionLoading === 'manual' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                تسجيل الحضور
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
