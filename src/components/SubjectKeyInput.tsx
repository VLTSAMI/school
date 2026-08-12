import React, { useState } from 'react';
import { Key, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { auth, claimClassWithKey } from '../lib/firebase';

interface SubjectKeyInputProps {
  onSuccess?: (classData?: any) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  compact?: boolean;
}

export default function SubjectKeyInput({
  onSuccess,
  title = "إدخال رمز المادة الممنوح من الإدارة",
  subtitle = "أدخل الكود المكون من حروف وأرقام لربط المادة بحسابك كأستاذ فوراً",
  buttonText = "ربط المادة بالحساب",
  compact = false
}: SubjectKeyInputProps) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim().toUpperCase();
    if (!cleanKey) {
      setError('يرجى إدخال رمز المادة');
      return;
    }

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setError('لم يتم التعرف على الأستاذ، يرجى إعادة تسجيل الدخول');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const teacherName = auth.currentUser?.displayName || '';
      const claimedClass = await claimClassWithKey(currentUid, cleanKey, teacherName);
      setSuccessMsg(`تم ربط مادة "${claimedClass.name}" بنجاح!`);
      setKeyInput('');
      if (onSuccess) {
        onSuccess(claimedClass);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء ربط المادة. تأكد من صحة الرمز.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card flex-col gap-md"
      style={{
        padding: compact ? '20px' : '28px',
        background: 'linear-gradient(135deg, rgba(255, 95, 31, 0.08), rgba(255, 95, 31, 0.02))',
        borderColor: 'rgba(255, 95, 31, 0.3)',
        borderRadius: compact ? '24px' : '32px'
      }}
    >
      <div className="flex items-center gap-sm">
        <div
          className="btn-icon"
          style={{
            background: 'rgba(255, 95, 31, 0.15)',
            color: 'var(--primary)',
            border: '1px solid rgba(255, 95, 31, 0.4)',
            width: compact ? '40px' : '48px',
            height: compact ? '40px' : '48px'
          }}
        >
          <Key size={compact ? 20 : 24} />
        </div>
        <div className="flex-col">
          <h3 style={{ margin: 0, fontSize: compact ? '15px' : '17px', color: 'var(--on-surface)' }} className="flex items-center gap-xs">
            {title} <Sparkles size={16} color="var(--primary)" />
          </h3>
          {subtitle && (
            <span className="text-secondary" style={{ fontSize: compact ? '11px' : '12px' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleClaim} className="flex-col gap-sm mt-xs">
        {error && (
          <div
            className="flex items-center gap-sm"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 77, 77, 0.1)',
              border: '1px solid rgba(255, 77, 77, 0.3)',
              color: 'var(--error)',
              fontSize: '12px'
            }}
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="flex items-center gap-sm"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              color: '#4ade80',
              fontSize: '12px'
            }}
          >
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="relative w-full">
          <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
            <Key size={18} />
          </span>
          <input
            type="text"
            className="input-field w-full font-en"
            placeholder="مثال: SUB-8A3X"
            style={{
              paddingRight: '48px',
              borderColor: 'var(--primary)',
              background: 'rgba(0, 0, 0, 0.3)',
              letterSpacing: '2px',
              fontWeight: 700,
              fontSize: '15px'
            }}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          style={{ borderRadius: '16px', height: '48px', fontSize: '14px', fontWeight: 700 }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>جاري التحقق والربط...</span>
            </>
          ) : (
            <>
              <Key size={18} />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
