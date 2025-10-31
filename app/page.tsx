'use client';

import { useState } from 'react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ padding: '3rem', background: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>
                スラング式カントン語音れん
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                粤ピン/スラング式カタカナ/音声検索
              </p>
            </div>
          </div>
        </div>

        {/* 検索エリア */}
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="広東語または日本語のフレーズを入力"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: '4rem',
              fontSize: '1rem',
              width: '50%',
              paddingLeft: '1rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
          <button
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            広東語発音
          </button>
          <button
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '6px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            日訳+広東語発音
          </button>
        </div>

        {/* 結果エリア */}
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '4px', background: 'white', display: 'none' }}>
          <p style={{ fontSize: '1.5rem' }}>検索結果がここに表示されます</p>
        </div>

        {/* 説明 */}
        <div style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '8px', fontSize: '1rem', lineHeight: '1.75' }}>
          <p style={{ fontWeight: '600' }}>広東語初心の方へ！ようこそスラング式広東語万能辞書へ！</p>
          <p>スラング先生考案!簡単指差し広東語☝️(全974単語)収録！</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>画面中央の広東語ボタンを押すと発音、音声が自動で表示されます</li>
            <li>広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください</li>
            <li>日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください</li>
            <li>ジャンル分け(トータル45ジャンル収録)は右側で押して切り替えを行なってください</li>
            <li>粤ピンとは香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)</li>
            <li>近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。</li>
            <li>スラング式カタカナとは広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。</li>
          </ul>
          <p style={{ fontSize: '0.625rem', lineHeight: '1.5' }}>
            この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。
          </p>
        </div>
      </div>
    </div>
  );
}
