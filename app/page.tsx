'use client';

import { useState } from 'react';

interface SearchResult {
  jyutping: string;
  katakana: string;
  jyutpingMulti: string;
  katakanaMulti: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/process-phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrase: query }),
      });

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateAndConvert = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // まず日本語を広東語に翻訳
      // TODO: 翻訳APIを実装
      alert('翻訳機能は今後実装予定です');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setResult(null);
      setLoading(false);
    }
  };

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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
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
            onClick={() => handleSearch(searchQuery)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '6px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? '検索中...' : '広東語発音'}
          </button>
          <button
            onClick={() => handleTranslateAndConvert(searchQuery)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '6px',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            日訳+広東語発音
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            background: '#fee2e2', 
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {/* 結果エリア */}
        {result && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1.5rem', 
            border: '1px solid #d1d5db', 
            borderRadius: '8px', 
            background: 'white'
          }}>
            <div style={{ fontSize: '1.5rem' }}>
              <p><strong style={{ textDecoration: 'underline' }}>粤ピン： {result.jyutping}</strong></p>
              <p><strong style={{ textDecoration: 'underline' }}>スラング式カタカナ： {result.katakana}</strong></p>
            </div>
          </div>
        )}

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
