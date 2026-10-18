'use client';

import { useEffect, useMemo, useState } from 'react';

type Reading = { jyutping: string; kana: string };
type Dict = Record<string, Reading[]>;

function isSkipped(ch: string) {
  if (/\s/u.test(ch)) return true;
  return /\p{P}|\p{S}/u.test(ch);
}

export default function SlangKanaPage() {
  const [dict, setDict] = useState<Dict | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/slang-dict.json')
      .then((response) => {
        if (!response.ok) throw new Error('辞書を読めませんでした');
        return response.json();
      })
      .then((data: Dict) => {
        if (!cancelled) setDict(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const characters = useMemo(
    () => Array.from(text.normalize('NFKC')).filter((ch) => !isSkipped(ch)),
    [text]
  );

  const rows = useMemo(() => {
    if (!dict) return [];
    return characters.map((ch) => {
      const readings = dict[ch];
      if (!readings?.length) {
        return { ch, kana: ch, sound: ch, readings: [] as Reading[], missing: true, varies: false };
      }
      const kanas = new Set(readings.map((item) => item.kana));
      return {
        ch,
        kana: readings[0].kana,
        sound: readings[0].jyutping.replace(/\s+/g, '・'),
        readings,
        missing: false,
        varies: kanas.size > 1,
      };
    });
  }, [characters, dict]);

  const varies = rows.some((row) => row.varies);
  const hanziCount = dict
    ? Object.keys(dict).filter((key) => !/^[A-Za-z]$/.test(key)).length
    : 0;
  const showAligned = characters.length > 1;

  return (
    <div className="shell">
      <main>
        <p className="kicker">粵拼 → スラング式カタカナ</p>
        <h1>スラング式広東語</h1>
        <p className="count">
          {dict ? `${hanziCount.toLocaleString('ja-JP')}字` : '辞書を読み込んでいます'}
          {error ? ` / ${error}` : ''}
        </p>
        <label>
          <span className="note">漢字</span>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="巴"
          />
        </label>

        {showAligned && (
          <div className="aligned" aria-live="polite">
            {rows.map((row, index) => (
              <div className="chunk" key={`${row.ch}-${index}`}>
                <div className="unit">
                  <div className="glyph">{row.ch}</div>
                  <div className={row.missing || row.kana === '未登録' ? 'kana missing' : 'kana'}>{row.kana}</div>
                  <div className="sound">{row.sound}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAligned && varies && <p className="note varies">複数読みは先頭を連結しています</p>}

        <div className="out">
          {rows.map((row, index) => (
            <article key={`detail-${row.ch}-${index}`}>
              <div className="ch">{row.ch}</div>
              {row.missing ? (
                <ul><li className="missing">未収録</li></ul>
              ) : (
                <ul>
                  {row.readings.map((item) => (
                    <li key={item.jyutping}>
                      <span className="py">{item.jyutping}</span>
                      <span className={item.kana === '未登録' ? 'missing' : ''}>{item.kana}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </main>

      <style jsx>{`
        .shell {
          min-height: 100vh;
          background: #f3efe4;
          color: #1c1915;
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Yu Mincho", serif;
        }
        main {
          width: min(720px, calc(100% - 32px));
          margin: 0 auto;
          padding: 48px 0 80px;
        }
        .kicker {
          margin: 0 0 8px;
          color: #8f2d2d;
          font-family: "Avenir Next", "Hiragino Sans", sans-serif;
          font-size: 12px;
          letter-spacing: 0.14em;
        }
        h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 600;
        }
        .count {
          margin: 8px 0 0;
          color: #6d6458;
          font-family: "Avenir Next", "Hiragino Sans", sans-serif;
          font-size: 13px;
        }
        label { display: block; margin-top: 28px; }
        input {
          width: 100%;
          border: 0;
          border-bottom: 2px solid #1c1915;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 28px;
          padding: 8px 0 10px;
          outline: none;
        }
        input::placeholder { color: #b3aa9c; }
        .aligned {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0.1rem 0.28rem;
          margin-top: 22px;
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
        .varies { margin: 6px 0 0; }
        .out { margin-top: 8px; }
        article {
          display: grid;
          grid-template-columns: 3.2rem 1fr;
          gap: 8px 16px;
          padding: 16px 0;
          border-bottom: 1px solid #d9d0c0;
        }
        .ch {
          font-size: 32px;
          line-height: 1.2;
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        li {
          display: flex;
          gap: 16px;
          align-items: baseline;
          padding: 2px 0;
          font-size: 20px;
        }
        .py {
          min-width: 7ch;
          color: #6d6458;
          font-family: "Avenir Next", "Hiragino Sans", sans-serif;
          font-size: 16px;
        }
        .missing { color: #8f2d2d; }
      `}</style>
    </div>
  );
}
