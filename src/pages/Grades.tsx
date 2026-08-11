import { FileText, Download } from 'lucide-react';

export default function Grades() {
  const grades = [
    { subject: 'الرياضيات', score: 92, grade: 'ممتاز', color: 'success' },
    { subject: 'العلوم', score: 87, grade: 'جيد جداً', color: 'success' },
    { subject: 'اللغة العربية', score: 95, grade: 'ممتاز', color: 'success' },
    { subject: 'اللغة الإنجليزية', score: 78, grade: 'جيد', color: 'warning' },
    { subject: 'التربية الإسلامية', score: 90, grade: 'ممتاز', color: 'success' },
  ];

  return (
    <div className="container flex-col gap-lg">
      {/* Header */}
      <div className="flex justify-between items-center mt-sm">
        <h2 className="flex items-center gap-sm" style={{ margin: 0 }}>
          <FileText color="var(--primary)" /> الدرجات والتقييمات
        </h2>
      </div>

      {/* Overview Card */}
      <div className="card flex justify-between items-center" style={{ background: 'linear-gradient(135deg, var(--surface-container), rgba(255, 95, 31, 0.05))' }}>
        <div>
          <p className="text-secondary mb-sm">المعدل العام</p>
          <div className="flex items-baseline gap-sm">
            <h1 style={{ fontSize: '48px', margin: 0, color: 'var(--primary)' }}>88.4</h1>
            <span className="text-secondary">%</span>
          </div>
          <p className="text-secondary mt-sm" style={{ fontSize: '12px' }}>الفصل الدراسي الأول</p>
        </div>
        
        {/* Circular Progress Placeholder */}
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'conic-gradient(var(--primary) 88.4%, var(--surface-container-highest) 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--surface-container)' }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-md" style={{ borderBottom: '1px solid var(--surface-container-highest)' }}>
        <button className="btn-ghost" style={{ padding: '12px', borderBottom: '2px solid var(--primary)', color: 'var(--on-surface)' }}>الفصل الأول</button>
        <button className="btn-ghost text-secondary" style={{ padding: '12px' }}>الفصل الثاني</button>
        <button className="btn-ghost text-secondary" style={{ padding: '12px' }}>السنة</button>
      </div>

      {/* Grades List */}
      <div className="flex-col gap-md">
        {grades.map(item => (
          <div key={item.subject} className="flex-col gap-sm">
            <div className="flex justify-between items-center">
              <span style={{ fontWeight: 600 }}>{item.subject}</span>
              <div className="flex items-center gap-md">
                <span className="text-secondary">{item.grade}</span>
                <span style={{ fontWeight: 700, minWidth: '32px', textAlign: 'left' }}>{item.score}</span>
              </div>
            </div>
            <div className="progress-track" style={{ height: '6px' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${item.score}%`, 
                  background: item.color === 'warning' ? '#f1c40f' : 'var(--primary)' 
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary w-full mt-lg flex items-center justify-center gap-sm">
        <Download size={20} />
        تحميل كشف الدرجات
      </button>

    </div>
  );
}
