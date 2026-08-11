import { Medal, Activity } from 'lucide-react';

export default function Profile() {
  return (
    <div className="container py-xl">
      <div className="flex-col items-center gap-lg">
        <div className="btn-icon" style={{ width: '100px', height: '100px', background: 'rgba(255, 95, 31, 0.1)', color: 'var(--primary)' }}>
          <Activity size={48} />
        </div>
        <h1 style={{ margin: 0 }}>الملف الشخصي</h1>
        <div className="card w-full flex items-center gap-md">
          <Medal color="var(--primary)" />
          <span>تم حذف واجهة الملف الشخصي بناءً على طلبك.</span>
        </div>
      </div>
    </div>
  );
}
