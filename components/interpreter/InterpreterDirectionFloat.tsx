'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import type { InterpreterDirection } from '@/lib/interpreter-direction';

export default function InterpreterDirectionFloat({
  direction,
  onToggle,
}: {
  direction: InterpreterDirection;
  onToggle: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const reversed = direction === 'yue-to-ja';

  return createPortal(
    <button
      type="button"
      data-interpreter-direction-float
      onClick={onToggle}
      aria-label={reversed ? '日本語入力→広東語通訳' : '香港→日本 広東語を話して日本語で聞く'}
      style={{
        position: 'fixed',
        left: 16,
        bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        zIndex: 2147483647,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        padding: '0 16px',
        border: 'none',
        borderRadius: 999,
        background: '#fff',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.16)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <img
        src={
          reversed
            ? '/images/interpreter/float-jp-to-hk.png?v=1'
            : '/images/interpreter/float-hk-to-jp.png?v=1'
        }
        alt={reversed ? '🇯🇵→🇭🇰' : '🇭🇰→🇯🇵'}
        draggable="false"
        style={{ width: 92, height: 32, objectFit: 'contain' }}
      />
    </button>,
    document.body
  );
}
