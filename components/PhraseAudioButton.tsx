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

  const playFromStart = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    try {
      if (!audio.paused) {
        audio.pause();
      }
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = 0;
      }
      await audio.play();
    } catch (error) {
      try {
        audio.load();
        audio.playbackRate = playbackRate;
        audio.currentTime = 0;
        await audio.play();
      } catch (retryError) {
        console.error('音声再生に失敗しました', retryError || error);
      }
    }
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }
    void playFromStart();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        playsInline
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          const audio = audioRef.current;
          if (audio && Number.isFinite(audio.duration)) {
            audio.currentTime = 0;
          }
          setPlaying(false);
        }}
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
