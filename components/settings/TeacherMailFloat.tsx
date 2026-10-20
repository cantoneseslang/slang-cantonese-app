'use client';

import { useEffect, useState } from 'react';
import TeacherMailBox from './TeacherMailBox';

type MailUser = { id?: string; email?: string; user_metadata?: { username?: string } } | null;

export default function TeacherMailFloat({ user }: { user: MailUser }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-teacher-mail-float]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div
      data-teacher-mail-float
      style={{
        position: 'fixed',
        left: 16,
        bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        maxWidth: 'min(360px, calc(100vw - 32px))',
      }}
    >
      {open && (
        <div
          style={{
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'min(70vh, 520px)',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '12px 14px',
          }}
        >
          {user?.id ? (
            <TeacherMailBox user={user} />
          ) : (
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              スラング先生にメールするにはログインしてください。
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 48,
          padding: '0 18px',
          border: 'none',
          borderRadius: 999,
          background: 'linear-gradient(145deg, #34C759, #248A3D)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" stroke="white" strokeWidth="1.8"/>
          <path d="m4 7 8 6 8-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        スラング先生へ連絡
      </button>
    </div>
  );
}
