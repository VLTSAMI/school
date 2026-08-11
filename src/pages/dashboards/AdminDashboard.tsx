import { useState, useEffect } from 'react';
import { Wallet, ScanLine, Search, LogOut, Users, TrendingUp, Key, CreditCard, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, subscribeToCollection, generateRegistrationKeys } from '../../lib/firebase';

interface AdminDashboardProps {
  transactions: any[];
}

export default function AdminDashboard({ transactions }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    let done = 0;
    const check = () => { done++; if (done >= 2) setLoading(false); };
    const u1 = subscribeToCollection('students', (data: any[]) => { setStudents(data.filter(s => s.name)); check(); });
    const u2 = subscribeToCollection('classes', (data: any[]) => { setClasses(data); check(); });
    return () => { u1(); u2(); };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = transactions
    .filter(t => t.timestamp?.startsWith(today))
    .reduce((sum, t) => sum + (t.adminShare || 0), 0);

  const thisMonth = new Date().toISOString().substring(0, 7);
  const monthRevenue = transactions
    .filter(t => t.timestamp?.startsWith(thisMonth))
    .reduce((sum, t) => sum + (t.adminShare || 0), 0);

  const expiredCount = students.filter(s => {
    const att = s.subjectAttendance || {};
    return Object.values(att).some((c: any) => c >= 30);
  }).length;

  const handleQuickKey = async () => {
    setGeneratingKey(true);
    try {
      const keys = await generateRegistrationKeys(1);
      setLastKey(keys[0]);
    } finally {
      setGeneratingKey(false);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    (t.studentName || '').includes(search) || (t.className || '').includes(search)
  );

  return (
    <div className="container flex-col gap-lg">
      <div className="flex justify-between items-center mt-sm">
        <div className="flex-col">
          <h1 style={{ margin: 0, fontSize: '22px' }}>لوحة المدير</h1>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <button className="btn-icon" onClick={logoutUser}><LogOut size={20} /></button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex justify-center py-md"><Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={28} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="card flex-col gap-xs" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(255,95,31,0.12), rgba(255,95,31,0.04))', cursor: 'pointer' }}
            onClick={() => navigate('/payments')}>
            <Wallet size={20} color="var(--primary)" />
            <span className="text-secondary" style={{ fontSize: '11px' }}>إيرادات اليوم</span>
            <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: 'var(--primary)' }}>{todayRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small></span>
          </div>
          <div className="card flex-col gap-xs" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate('/scanner')}>
            <ScanLine size={20} color="var(--primary)" />
            <span className="text-secondary" style={{ fontSize: '11px' }}>مسح الحضور</span>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>بدء المسح</span>
          </div>
          <div className="card flex-col gap-xs" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate('/stats')}>
            <TrendingUp size={20} color="#60a5fa" />
            <span className="text-secondary" style={{ fontSize: '11px' }}>إيرادات الشهر</span>
            <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: '#60a5fa' }}>{monthRevenue.toLocaleString()}<small style={{ fontSize: '11px' }}> DA</small></span>
          </div>
          <div className="card flex-col gap-xs" style={{ padding: '16px' }}>
            <Users size={20} color="#a78bfa" />
            <span className="text-secondary" style={{ fontSize: '11px' }}>الطلاب</span>
            <span className="number" style={{ fontWeight: 700, fontSize: '20px', color: '#a78bfa' }}>{students.length}</span>
            {expiredCount > 0 && (
              <span style={{ fontSize: '10px', color: 'var(--error)' }}>⛔ {expiredCount} منتهي الاشتراك</span>
            )}
          </div>
        </div>
      )}

      {/* Quick Key Generator */}
      <div className="card flex items-center justify-between" style={{ padding: '14px 18px', background: 'rgba(255,95,31,0.05)', borderColor: 'rgba(255,95,31,0.2)' }}>
        <div className="flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <Key size={16} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>مفتاح تسجيل سريع</span>
          </div>
          {lastKey && (
            <span className="number" style={{ fontSize: '16px', letterSpacing: '3px', color: 'var(--primary)', fontWeight: 700 }}>{lastKey}</span>
          )}
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '12px' }}
          onClick={handleQuickKey}
          disabled={generatingKey}
        >
          {generatingKey ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
          {generatingKey ? '...' : 'توليد'}
        </button>
      </div>

      {/* Quick Nav */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { label: 'إدارة الطلاب', icon: Users, path: '/classes', color: '#4ade80' },
          { label: 'المدفوعات', icon: CreditCard, path: '/payments', color: '#60a5fa' },
          { label: 'الإحصائيات', icon: BarChart3, path: '/stats', color: '#a78bfa' },
          { label: 'الجدول', icon: ScanLine, path: '/schedule', color: '#facc15' },
        ].map(item => (
          <button key={item.path} className="card flex items-center gap-sm" style={{ padding: '14px 16px', cursor: 'pointer', border: 'none', background: 'var(--surface)', textAlign: 'right' }}
            onClick={() => navigate(item.path)}>
            <item.icon size={18} style={{ color: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Search & Transactions */}
      <div className="relative w-full">
        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
          <Search size={18} className="text-secondary" />
        </span>
        <input type="text" className="input-field w-full" placeholder="البحث عن معاملة أو طالب..."
          style={{ paddingRight: '48px' }} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex-col gap-sm">
        <h3 style={{ margin: 0, fontSize: '15px' }}>آخر النشاطات</h3>
        {filteredTransactions.length === 0 ? (
          <p className="text-secondary text-center" style={{ fontSize: '14px', padding: '24px 0' }}>لا توجد نشاطات حالياً</p>
        ) : (
          filteredTransactions.slice(0, 8).map((t, i) => (
            <div key={i} className="card flex items-center justify-between" style={{ padding: '14px 18px' }}>
              <div className="flex items-center gap-sm">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                <div className="flex-col">
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.studentName}</span>
                  <span className="text-secondary" style={{ fontSize: '11px' }}>{t.className}</span>
                </div>
              </div>
              <div className="flex-col items-end">
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '13px' }}>+{(t.adminShare || 0).toLocaleString()} DA</span>
                <span className="text-secondary font-en" style={{ fontSize: '10px' }}>
                  {t.timestamp ? new Date(t.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : '---'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ height: '40px' }}></div>
    </div>
  );
}
