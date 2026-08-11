import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, BookOpen, AlertTriangle, RefreshCw, Key, Loader2, Copy, Check } from 'lucide-react';
import { subscribeToCollection, generateRegistrationKeys } from '../lib/firebase';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
}

export default function Stats() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [newGeneratedKeys, setNewGeneratedKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyCount, setKeyCount] = useState(5);

  useEffect(() => {
    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 4) setLoading(false); };

    const u1 = subscribeToCollection('transactions', (data: any[]) => { setTransactions(data); checkDone(); });
    const u2 = subscribeToCollection('students', (data: any[]) => { setStudents(data.filter(s => s.name)); checkDone(); });
    const u3 = subscribeToCollection('classes', (data: any[]) => { setClasses(data); checkDone(); });
    const u4 = subscribeToCollection('keys', (data: any[]) => { setKeys(data); checkDone(); });

    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  if (loading) return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
    </div>
  );

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const todayTransactions = transactions.filter(t => t.timestamp?.startsWith(todayStr));
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.adminShare || 0), 0);
  const todayAttendance = todayTransactions.length;

  const thisMonth = new Date().toISOString().substring(0, 7);
  const monthTransactions = transactions.filter(t => t.timestamp?.startsWith(thisMonth));
  const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.adminShare || 0), 0);

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.adminShare || 0), 0);

  // Students near expiry (>= 25 sessions in any class)
  const nearExpiry = students.filter(s => {
    const attendance = s.subjectAttendance || {};
    return Object.values(attendance).some((count: any) => count >= 25 && count < 30);
  });

  const expired = students.filter(s => {
    const attendance = s.subjectAttendance || {};
    return Object.values(attendance).some((count: any) => count >= 30);
  });

  // Revenue per class
  const classRevenue: Record<string, number> = {};
  transactions.forEach(t => {
    if (!classRevenue[t.className]) classRevenue[t.className] = 0;
    classRevenue[t.className] += t.adminShare || 0;
  });
  const topClasses = Object.entries(classRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const usedKeys = keys.filter(k => k.used).length;
  const unusedKeys = keys.filter(k => !k.used).length;

  const handleGenerateKeys = async () => {
    setGeneratingKeys(true);
    try {
      const generated = await generateRegistrationKeys(keyCount);
      setNewGeneratedKeys(generated);
    } catch (e) {
      alert("خطأ في توليد المفاتيح");
    } finally {
      setGeneratingKeys(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statCards: StatCard[] = [
    { label: 'إيرادات اليوم', value: `${todayRevenue.toLocaleString()} DA`, sub: `${todayAttendance} حضور`, icon: DollarSign, color: '#4ade80' },
    { label: 'إيرادات الشهر', value: `${monthRevenue.toLocaleString()} DA`, sub: thisMonth, icon: TrendingUp, color: 'var(--primary)' },
    { label: 'إجمالي الطلاب', value: students.length, sub: `${classes.length} مادة`, icon: Users, color: '#60a5fa' },
    { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString()} DA`, sub: `${transactions.length} معاملة`, icon: DollarSign, color: '#a78bfa' },
  ];

  return (
    <div className="container flex-col gap-lg">
      <h2 className="flex items-center gap-sm mt-sm">
        <TrendingUp color="var(--primary)" /> الإحصائيات والتقارير
      </h2>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="card flex-col gap-xs" style={{ padding: '16px' }}>
            <card.icon size={20} style={{ color: card.color }} />
            <span className="text-secondary" style={{ fontSize: '11px' }}>{card.label}</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: card.color }}>{card.value}</span>
            {card.sub && <span className="text-secondary" style={{ fontSize: '10px' }}>{card.sub}</span>}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(nearExpiry.length > 0 || expired.length > 0) && (
        <div className="flex-col gap-sm">
          <h3 className="mb-xs flex items-center gap-sm">
            <AlertTriangle size={18} color="#facc15" /> تنبيهات الاشتراكات
          </h3>
          {expired.length > 0 && (
            <div className="card" style={{ background: 'rgba(255,77,77,0.08)', borderColor: 'rgba(255,77,77,0.3)', padding: '14px 18px' }}>
              <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '13px' }}>
                ⛔ {expired.length} طالب انتهى اشتراكهم — يحتاجون تجديد
              </span>
              <div className="flex flex-wrap gap-xs mt-sm">
                {expired.slice(0, 6).map(s => (
                  <span key={s.id} className="chip primary" style={{ background: 'rgba(255,77,77,0.1)', color: 'var(--error)', fontSize: '10px' }}>{s.name}</span>
                ))}
              </div>
            </div>
          )}
          {nearExpiry.length > 0 && (
            <div className="card" style={{ background: 'rgba(250,204,21,0.06)', borderColor: 'rgba(250,204,21,0.25)', padding: '14px 18px' }}>
              <span style={{ color: '#facc15', fontWeight: 600, fontSize: '13px' }}>
                ⚠️ {nearExpiry.length} طالب على وشك انتهاء الاشتراك (أكثر من 25 حصة)
              </span>
              <div className="flex flex-wrap gap-xs mt-sm">
                {nearExpiry.slice(0, 6).map(s => (
                  <span key={s.id} className="chip" style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', fontSize: '10px' }}>{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Classes by Revenue */}
      {topClasses.length > 0 && (
        <div className="flex-col gap-sm">
          <h3 className="mb-xs flex items-center gap-sm">
            <BookOpen size={18} color="var(--primary)" /> أفضل المواد ربحاً
          </h3>
          {topClasses.map(([name, rev], i) => {
            const maxRev = topClasses[0][1];
            return (
              <div key={name} className="card flex items-center gap-md" style={{ padding: '14px 18px' }}>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)', minWidth: '24px' }}>#{i + 1}</span>
                <div className="flex-col flex-1 gap-xs">
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(rev / maxRev) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '13px', whiteSpace: 'nowrap' }}>{rev.toLocaleString()} DA</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Management */}
      <div className="flex-col gap-sm">
        <h3 className="mb-xs flex items-center gap-sm">
          <Key size={18} color="var(--primary)" /> مفاتيح التسجيل
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="card flex-col gap-xs" style={{ padding: '14px', background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' }}>
            <span className="text-secondary" style={{ fontSize: '11px' }}>متاحة للاستخدام</span>
            <span style={{ fontWeight: 700, fontSize: '24px', color: '#4ade80' }}>{unusedKeys}</span>
          </div>
          <div className="card flex-col gap-xs" style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderColor: 'var(--surface-container-highest)' }}>
            <span className="text-secondary" style={{ fontSize: '11px' }}>مستخدمة</span>
            <span style={{ fontWeight: 700, fontSize: '24px' }}>{usedKeys}</span>
          </div>
        </div>

        <div className="card flex-col gap-md" style={{ background: 'rgba(255,95,31,0.05)', borderColor: 'rgba(255,95,31,0.2)' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>توليد مفاتيح جديدة</span>
          <div className="flex gap-sm items-center">
            <input
              type="number"
              className="input-field"
              value={keyCount}
              onChange={e => setKeyCount(Math.max(1, Math.min(50, Number(e.target.value))))}
              min={1} max={50}
              style={{ width: '80px', textAlign: 'center', padding: '10px' }}
            />
            <button
              className="btn btn-primary flex-1"
              style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px' }}
              onClick={handleGenerateKeys}
              disabled={generatingKeys}
            >
              {generatingKeys ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {generatingKeys ? 'جاري التوليد...' : `توليد ${keyCount} مفاتيح`}
            </button>
          </div>

          {newGeneratedKeys.length > 0 && (
            <div className="flex-col gap-xs">
              <span className="text-secondary" style={{ fontSize: '11px' }}>المفاتيح المولّدة — انقر للنسخ:</span>
              <div className="flex flex-wrap gap-sm">
                {newGeneratedKeys.map(k => (
                  <button key={k} onClick={() => copyKey(k)} className="btn-tag active flex items-center gap-xs" style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '2px' }}>
                    {copiedKey === k ? <Check size={12} color="#4ade80" /> : <Copy size={12} />} {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
