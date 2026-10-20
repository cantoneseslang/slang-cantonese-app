'use client';

import { useEffect, useState, type RefObject } from 'react';

export default function PhraseAudioButton({
  audioRef,
  src,
  playbackRate = 1,
  isMobile = false,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  src: string;
  playbackRate?: number;
  isMobile?: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [audioRef, playbackRate, src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error('音声再生に失敗しました', error);
      }
      return;
    }
    audio.pause();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        style={{ display: 'none' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        aria-label={playing ? '一時停止' : '再生'}
        onClick={() => {
          void toggle();
        }}
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          minHeight: isMobile ? '56px' : '48px',
          padding: isMobile ? '0.75rem 1.1rem' : '0.65rem 1.1rem',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          cursor: 'pointer',
          color: '#111827',
          fontSize: isMobile ? '1rem' : '1.05rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {playing ? '一時停止' : '再生'}
      </button>
    </>
  );
}
