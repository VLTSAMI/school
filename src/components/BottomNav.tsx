import { Home, BookOpen, ScanLine, BarChart3, CreditCard, Calendar, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem('userRole') || 'student';

  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { icon: Home, label: 'الرئيسية', path: '/dashboard' },
        { icon: BookOpen, label: 'الطلاب', path: '/classes' },
        { icon: ScanLine, label: 'المسح', path: '/scanner' },
        { icon: CreditCard, label: 'المدفوعات', path: '/payments' },
        { icon: BarChart3, label: 'إحصائيات', path: '/stats' },
      ];
    }

    if (role === 'teacher') {
      return [
        { icon: Home, label: 'الرئيسية', path: '/dashboard' },
        { icon: BookOpen, label: 'المواد', path: '/classes' },
        { icon: Calendar, label: 'الجدول', path: '/schedule' },
        { icon: Settings, label: 'الإعدادات', path: '/settings' },
      ];
    }

    // Student
    return [
      { icon: Home, label: 'الرئيسية', path: '/dashboard' },
      { icon: BookOpen, label: 'المواد', path: '/classes' },
      { icon: Calendar, label: 'الجدول', path: '/schedule' },
      { icon: ScanLine, label: 'هويتي', path: '/idcard' },
      { icon: Settings, label: 'إعداداتي', path: '/settings' },
    ];
  };

  if (['/', '/login', '/register'].includes(location.pathname)) return null;

  const navItems = getNavItems();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
