'use client';

import { useEffect, useMemo, useState } from 'react';

type Reading = { jyutping: string; kana: string };
type Dict = Record<string, Reading[]>;

let dictPromise: Promise<Dict> | null = null;

function loadDict() {
  if (!dictPromise) {
    dictPromise = fetch('/slang-dict.json').then((response) => {
      if (!response.ok) throw new Error('辞書を読めませんでした');
      return response.json();
    });
  }
  return dictPromise;
}

function isSkipped(ch: string) {
  if (/\s/u.test(ch)) return true;
  return /\p{P}|\p{S}/u.test(ch);
}

function kanaParts(kana: string) {
  return kana.replaceAll('（', '(').replaceAll('）', ')').split(/([()])/);
}

function useSlangRows(text: string) {
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDict()
      .then((data) => {
        if (!cancelled) setDict(data);
      })
      .catch(() => {
        if (!cancelled) setDict({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    if (!dict) return [];
    return Array.from(text.normalize('NFKC'))
      .filter((ch) => !isSkipped(ch))
      .map((ch) => {
        const readings = dict[ch];
        if (!readings?.length) {
          return { ch, kana: ch, sound: ch, varies: false };
        }
        const kanas = new Set(readings.map((item) => item.kana));
        return {
          ch,
          kana: readings[0].kana,
          sound: readings[0].jyutping.replace(/\s+/g, '・'),
          varies: kanas.size > 1,
        };
      });
  }, [dict, text]);
}

export function SlangBookmarkRow({ phrase, translation = '' }: { phrase: string; translation?: string }) {
  const rows = useSlangRows(phrase);

  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', width: '100%' }}>
      <span style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.4 }}>{phrase}</span>
      <span
        style={{
          fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, "Yu Mincho", serif',
          fontSize: '0.95rem',
          lineHeight: 1.45,
          color: '#4b5563',
        }}
      >
        {rows.map((row, index) => (
          <span key={`${row.ch}-${index}`}>
            {index > 0 ? ' ' : ''}
            {kanaParts(row.kana).map((part, partIndex) =>
              part === '(' || part === ')' ? (
                <span key={partIndex} style={{ fontFamily: '"Avenir Next", "Hiragino Sans", "Helvetica Neue", sans-serif' }}>{part}</span>
              ) : (
                part
              )
            )}
          </span>
        ))}
      </span>
      <span
        style={{
          fontFamily: '"Avenir Next", "Hiragino Sans", sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.4,
          color: '#6b7280',
        }}
      >
        {rows.map((row) => row.sound).join(' ')}
      </span>
      {translation ? (
        <span style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#1d1d1f' }}>
          翻訳：{translation}
        </span>
      ) : null}
    </span>
  );
}

export default function SlangAlignedReading({
  text,
  bookmarked = false,
  onToggleBookmark,
}: {
  text: string;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  const rows = useSlangRows(text);

  if (!rows.length) return null;
  const varies = rows.some((row) => row.varies);

  return (
    <div className="slang-reading">
      <div className="reading-row">
        {onToggleBookmark && (
          <button
            type="button"
            className="bookmark-star"
            aria-pressed={bookmarked}
            aria-label="ブックマーク"
            onClick={onToggleBookmark}
            style={{ color: bookmarked ? '#f5c518' : '#c8c8c8' }}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        )}
      <div className="aligned">
        {rows.map((row, index) => (
          <div className="chunk" key={`${row.ch}-${index}`}>
            <div className="unit">
              <div className="glyph">{row.ch}</div>
              <div className="kana">
                {kanaParts(row.kana).map((part, partIndex) =>
                  part === '(' || part === ')' ? (
                    <span key={partIndex} style={{ fontFamily: '"Avenir Next", "Hiragino Sans", "Helvetica Neue", sans-serif' }}>{part}</span>
                  ) : (
                    part
                  )
                )}
              </div>
              <div className="sound">{row.sound}</div>
            </div>
          </div>
        ))}
      </div>
      </div>
      {varies && <p className="note">複数読みは先頭を連結しています</p>}
      <style jsx>{`
        .reading-row {
          display: flex;
          align-items: flex-start;
          gap: 0.15rem;
        }
        .bookmark-star {
          flex: 0 0 auto;
          width: 1.6rem;
          height: calc(26px * 1.3);
          margin: 0;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
          touch-action: manipulation;
        }
        .slang-reading {
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Yu Mincho", serif;
          color: #1c1915;
        }
        .aligned {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0.1rem 0.28rem;
        }
        .chunk { display: flex; align-items: flex-start; }
        .unit {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .glyph {
          font-size: 26px;
          line-height: 1.3;
          white-space: nowrap;
        }
        .kana {
          font-size: 18px;
          line-height: 1.25;
          white-space: nowrap;
        }
        .sound {
          margin-top: 2px;
          color: #6d6458;
          font-family: "Avenir Next", "Hiragino Sans", sans-serif;
          font-size: 15px;
          line-height: 1.3;
          white-space: nowrap;
        }
        .note {
          margin: 6px 0 0;
          color: #6d6458;
          font-family: "Avenir Next", "Hiragino Sans", sans-serif;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
