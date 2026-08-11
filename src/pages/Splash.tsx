import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Force redirect to registration page even if logged in (as per user request)
    // This allows the user to always see the registration flow when they open the site link.
    const timer = setTimeout(() => {
      navigate('/register');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '100vh', gap: '24px', background: '#0a0a0a' }}>
      <div className="relative">
        <div style={{ position: 'absolute', inset: '-20px', background: 'var(--primary)', filter: 'blur(40px)', opacity: 0.3, borderRadius: '50%' }} />
        <div className="btn-icon" style={{ width: '120px', height: '120px', fontSize: '48px', position: 'relative', background: 'rgba(255, 95, 31, 0.1)' }}>💡</div>
      </div>
      <div className="flex-col items-center">
        <h1 style={{ fontSize: '32px', marginBottom: '4px', color: '#fff' }}>Lumina Learn</h1>
        <p className="text-secondary" style={{ letterSpacing: '4px', fontSize: '12px' }}>MANAGEMENT SYSTEM</p>
      </div>
      <div className="mt-xl">
        <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'var(--primary)', transform: 'translateX(-100%)', animation: 'loading 1.5s infinite linear' }} />
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
