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
      aria-label={reversed ? '日本語入力→広東語通訳' : '広東語入力→日本語通訳'}
      style={{
        position: 'fixed',
        left: 16,
        bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        zIndex: 2147483647,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 48,
        padding: '0 18px 0 12px',
        border: 'none',
        borderRadius: 999,
        background: reversed
          ? 'linear-gradient(145deg, #34C759, #248A3D)'
          : 'linear-gradient(145deg, #007AFF, #0051D5)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        boxShadow: reversed
          ? '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
          : '0 4px 12px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <img
        src={
          reversed
            ? '/images/convert/jp-to-hk.png?v=2'
            : '/images/interpreter/hk-to-jp.png?v=1'
        }
        alt=""
        draggable="false"
        style={{ width: 36, height: 22, objectFit: 'contain' }}
      />
      {reversed ? '🇯🇵→🇭🇰' : '🇭🇰→🇯🇵'}
    </button>,
    document.body
  );
}
