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

export default function SlangAlignedReading({ text }: { text: string }) {
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

  const rows = useMemo(() => {
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

  if (!rows.length) return null;
  const varies = rows.some((row) => row.varies);

  return (
    <div className="slang-reading">
      <div className="aligned">
        {rows.map((row, index) => (
          <div className="chunk" key={`${row.ch}-${index}`}>
            <div className="unit">
              <div className="glyph">{row.ch}</div>
              <div className="kana">{row.kana}</div>
              <div className="sound">{row.sound}</div>
            </div>
            {index < rows.length - 1 && (
              <div className="dot-col">
                <div className="spacer">・</div>
                <div className="dot">・</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {varies && <p className="note">複数読みは先頭を連結しています</p>}
      <style jsx>{`
        .slang-reading {
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Yu Mincho", serif;
          color: #1c1915;
        }
        .aligned {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
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
          font-size: 22px;
          line-height: 1.4;
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
        .dot-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0.08em;
        }
        .spacer {
          font-size: 26px;
          line-height: 1.3;
          visibility: hidden;
        }
        .dot { font-size: 22px; line-height: 1.4; }
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
