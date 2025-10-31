'use client';

import { useState, useEffect, useRef } from 'react';
import categoriesData from '@/data/categories.json';

interface SearchResult {
  jyutping: string;
  katakana: string;
  jyutpingMulti: string;
  katakanaMulti: string;
  audioBase64?: string;
  exampleCantonese?: string;
  exampleJapanese?: string;
  exampleFull?: string;
  exampleAudioBase64?: string;
}

interface Word {
  chinese: string;
  japanese: string;
}

interface PracticeGroup {
  name: string;
  words: Word[];
}

interface Category {
  id: string;
  name: string;
  words?: Word[];
  introContent?: string;
  practiceGroups?: PracticeGroup[];
  style?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const exampleAudioRef = useRef<HTMLAudioElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [examplePlaybackSpeed, setExamplePlaybackSpeed] = useState('1');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    // モバイル判定
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // カテゴリデータを読み込む
    setCategories(categoriesData as Category[]);
    
    // 最初のカテゴリを選択（pronunciationを最初に表示）
    if (categoriesData.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesData[0].id);
      setCurrentCategory(categoriesData[0]);
      setCurrentWords(categoriesData[0].words || []);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        setCurrentCategory(category);
        setCurrentWords(category.words || []);
        // カテゴリーを選択したらメニューを閉じる
        if (isMobile) {
          setIsMenuOpen(false);
        }
      }
    }
  }, [selectedCategory, categories]);

  // スワイプ検出
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.touches[0].clientX;
    const diff = touchEndX - touchStartX;

    // 右に30px以上スワイプしたらメニューを開く
    if (diff > 30 && !isMenuOpen) {
      setIsMenuOpen(true);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

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
      
      // 単語音声を生成
      const audioResponse = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });

      let resultData = { ...data };
      
      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        resultData.audioBase64 = audioData.audioContent;
      }

      // 例文音声を生成
      if (data.exampleCantonese && data.exampleCantonese !== '例文生成エラーが発生しました') {
        const exampleAudioResponse = await fetch('/api/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: data.exampleCantonese }),
        });

        if (exampleAudioResponse.ok) {
          const exampleAudioData = await exampleAudioResponse.json();
          resultData.exampleAudioBase64 = exampleAudioData.audioContent;
        }
      }

      setResult(resultData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (word: Word) => {
    setSearchQuery(word.chinese);
    await handleSearch(word.chinese);
  };

  const handleTranslateAndConvert = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      alert('翻訳機能は今後実装予定です');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setResult(null);
      setLoading(false);
    }
  };

  // 単語音声再生速度変更
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed);
    }
  }, [playbackSpeed]);

  // 例文音声再生速度変更
  useEffect(() => {
    if (exampleAudioRef.current) {
      exampleAudioRef.current.playbackRate = parseFloat(examplePlaybackSpeed);
    }
  }, [examplePlaybackSpeed]);

  return (
    <div 
      style={{ 
        margin: 0, 
        padding: isMobile ? '1rem' : '3rem', 
        backgroundColor: '#f3f4f6', 
        minHeight: '100vh',
        position: 'relative'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px',
        margin: '0 auto',
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 200px',
        gap: isMobile ? '1rem' : '2rem'
      }}>
        {/* メインコンテンツエリア */}
        <div>
          {/* ヘッダー */}
          <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
            <div style={{ 
              background: 'white', 
              padding: isMobile ? '1rem' : '1.5rem', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
            }}>
              <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
                <h1 style={{ 
                  fontSize: isMobile ? '1.5rem' : '2.5rem', 
                  fontWeight: 'bold', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  スラング式カントン語音れん
                </h1>
                <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#6b7280', margin: 0 }}>
                  粤ピン/スラング式カタカナ/音声検索
                </p>
              </div>
            </div>
          </div>

          {/* 検索エリア */}
          <div style={{ marginBottom: '1rem' }}>
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
                height: isMobile ? '3rem' : '4rem',
                fontSize: isMobile ? '1rem' : '1rem',
                width: '100%',
                paddingLeft: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem 1rem' : '10px 20px',
                  fontSize: isMobile ? '0.875rem' : '1rem',
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
                  flex: 1,
                  padding: isMobile ? '0.75rem 1rem' : '10px 20px',
                  fontSize: isMobile ? '0.875rem' : '1rem',
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
          </div>

          {/* エラー表示 */}
          {error && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              border: '1px solid #ef4444', 
              borderRadius: '4px', 
              background: '#fee2e2', 
              color: '#991b1b',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              {error}
            </div>
          )}

          {/* 結果エリア */}
          {result && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: isMobile ? '1rem' : '1.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              background: 'white'
            }}>
              <p style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                <strong style={{ textDecoration: 'underline' }}>粤ピン： {result.jyutping}</strong>
              </p>
              <p style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
                <strong style={{ textDecoration: 'underline' }}>スラング式カタカナ： {result.katakana}</strong>
              </p>
              
              {/* 例文表示 */}
              {result.exampleCantonese && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    <strong>例文： {result.exampleCantonese}</strong>
                  </p>
                  {result.exampleJapanese && (
                    <p style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      <strong>例文日本語翻訳： {result.exampleJapanese}</strong>
                    </p>
                  )}
                </div>
              )}
              
              {/* 単語音声プレーヤー */}
              {result.audioBase64 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '18px', fontWeight: 'bold' }}>
                    単語音声: {searchQuery}
                  </p>
                  <audio 
                    ref={audioRef}
                    controls 
                    controlsList="nodownload nofullscreen noremoteplayback"
                    style={{ width: '100%', height: '100px' }}
                    src={`data:audio/mp3;base64,${result.audioBase64}`}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: isMobile ? '0.875rem' : '24px' }}>再生速度: </label>
                    <select 
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(e.target.value)}
                      style={{ 
                        padding: isMobile ? '5px 10px' : '24px', 
                        fontSize: isMobile ? '0.875rem' : '24px', 
                        borderRadius: '8px', 
                        border: '1px solid #ccc', 
                        width: 'auto' 
                      }}
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 例文音声プレーヤー */}
              {result.exampleAudioBase64 && result.exampleCantonese && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '18px', fontWeight: 'bold' }}>
                    例文音声: {result.exampleCantonese}
                  </p>
                  <audio 
                    ref={exampleAudioRef}
                    controls 
                    controlsList="nodownload nofullscreen noremoteplayback"
                    style={{ width: '100%', height: '100px' }}
                    src={`data:audio/mp3;base64,${result.exampleAudioBase64}`}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: isMobile ? '0.875rem' : '24px' }}>再生速度: </label>
                    <select 
                      value={examplePlaybackSpeed}
                      onChange={(e) => setExamplePlaybackSpeed(e.target.value)}
                      style={{ 
                        padding: isMobile ? '5px 10px' : '24px', 
                        fontSize: isMobile ? '0.875rem' : '24px', 
                        borderRadius: '8px', 
                        border: '1px solid #ccc', 
                        width: 'auto' 
                      }}
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* practiceGroups表示（pronunciation用） */}
          {currentCategory && currentCategory.introContent && currentCategory.practiceGroups && (
            <div style={{ 
              background: 'white', 
              padding: isMobile ? '1rem' : '1.5rem', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '1.5rem'
            }}>
              <div dangerouslySetInnerHTML={{ __html: currentCategory.introContent }} />
              {currentCategory.practiceGroups.map((group, gIdx) => (
                <div key={gIdx}>
                  <h3 style={{ 
                    fontSize: isMobile ? '1rem' : '1.25rem', 
                    fontWeight: 'bold', 
                    marginTop: '1rem', 
                    marginBottom: '0.5rem' 
                  }}>
                    {group.name}
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    {group.words.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => handleWordClick(word)}
                        style={{
                          background: 'white',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <strong style={{ fontSize: isMobile ? '1.25rem' : '1.875rem' }}>
                          {word.chinese}
                        </strong>
                        <div style={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                          {word.japanese}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    marginBottom: '1rem', 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: '#f9fafb', 
                    borderRadius: '4px', 
                    border: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ marginBottom: '0.25rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      <span style={{ fontWeight: '600' }}>中国語：</span>
                      {group.words.map(word => word.chinese).join('、')}
                    </div>
                    <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      <span style={{ fontWeight: '600' }}>発音：</span>
                      {group.words.map(word => word.japanese).join('、')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 通常の単語ボタングリッド */}
          {currentWords.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {currentWords.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWordClick(word)}
                  style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    height: isMobile ? '100px' : '128px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: isMobile ? '1.5rem' : '1.875rem' }}>
                    {word.chinese}
                  </strong>
                  <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    {word.japanese}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 説明 */}
          <div style={{ 
            marginTop: '1rem', 
            background: 'white', 
            padding: isMobile ? '1rem' : '1.5rem', 
            borderRadius: '8px', 
            fontSize: isMobile ? '0.875rem' : '1rem', 
            lineHeight: '1.75' 
          }}>
            <p style={{ fontWeight: '600' }}>広東語初心の方へ！ようこそスラング式広東語万能辞書へ！</p>
            <p>スラング先生考案!簡単指差し広東語☝️(全974単語)収録！</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>画面中央の広東語ボタンを押すと発音、音声が自動で表示されます</li>
              <li>広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください</li>
              <li>日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください</li>
              <li>ジャンル分け(トータル73ジャンル収録)は右側で押して切り替えを行なってください</li>
              <li>粤ピンとは香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)</li>
              <li>近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。</li>
              <li>スラング式カタカナとは広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。</li>
            </ul>
            <p style={{ fontSize: isMobile ? '0.5rem' : '0.625rem', lineHeight: '1.5' }}>
              この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。
            </p>
          </div>
        </div>

        {/* サイドバー */}
        {isMobile ? (
          // モバイル: フロートメニュー
          <>
            {/* 常に見える右端のカテゴリーリスト部分 */}
            <div 
              style={{
                position: 'fixed',
                right: 0,
                top: 0,
                bottom: 0,
                width: '50px',
                backgroundColor: 'white',
                borderLeft: '2px solid #6366f1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '1rem',
                overflowY: 'auto',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
                zIndex: 1001
              }}
            >
              {categories.map((category, idx) => (
                <div 
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  title={category.name}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    maxWidth: '40px',
                    overflow: 'hidden'
                  }}>
                    {category.name.split('\n')[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* オーバーレイ */}
            {isMenuOpen && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 998,
                  transition: 'opacity 0.3s ease'
                }}
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            {/* サイドバー */}
            <div 
              ref={sidebarRef}
              style={{
                position: 'fixed',
                top: 0,
                right: isMenuOpen ? 0 : '-85%',
                bottom: 0,
                width: '85%',
                maxWidth: '300px',
                backgroundColor: 'white',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
                zIndex: 999,
                transition: 'right 0.3s ease',
                overflowY: 'auto',
                padding: '1rem'
              }}
            >
              {/* ロゴ */}
              <div style={{ marginBottom: '0.5rem' }}>
                <a href="https://line.me/R/ti/p/@298mwivr" target="_blank">
                  <img 
                    src="data:image/png;base64,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"
                    alt="スラング先生ロゴ"
                    style={{ height: 'auto', maxWidth: '100%' }}
                  />
                </a>
              </div>

              {/* ジャンル分け */}
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem' 
              }}>
                ジャンル分け
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      borderRadius: '4px',
                      backgroundColor: selectedCategory === category.id ? '#e5e7eb' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: category.name.replace(/\n/g, '<br>') }} />
                  </button>
                ))}
              </div>

              {/* クイズボタン */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem' 
                }}>
                  学習ゲーム
                </h3>
                <button
                  style={{
                    width: '100%',
                    padding: '10px 20px',
                    fontSize: '1rem',
                    borderRadius: '6px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onClick={() => alert('クイズ機能は今後実装予定です')}
                >
                  復習確認クイズ
                </button>
              </div>
            </div>

          </>
        ) : (
          // デスクトップ: 通常のサイドバー
          <div style={{ 
            borderLeft: '1px solid #d1d5db',
            paddingLeft: '1rem'
          }}>
            {/* ロゴ */}
            <div style={{ marginBottom: '0.5rem' }}>
              <a href="https://line.me/R/ti/p/@298mwivr" target="_blank">
                <img 
                  src="data:image/png;base64,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"
                  alt="スラング先生ロゴ"
                  style={{ height: 'auto', maxWidth: '100%' }}
                />
              </a>
            </div>

            {/* ジャンル分け */}
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem' 
            }}>
              ジャンル分け
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    padding: '0.5rem',
                    textAlign: 'left',
                    borderRadius: '4px',
                    backgroundColor: selectedCategory === category.id ? '#e5e7eb' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: category.name.replace(/\n/g, '<br>') }} />
                </button>
              ))}
            </div>

            {/* クイズボタン */}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                marginBottom: '0.5rem' 
              }}>
                学習ゲーム
              </h3>
              <button
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  fontSize: '1rem',
                  borderRadius: '6px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onClick={() => alert('クイズ機能は今後実装予定です')}
              >
                復習確認クイズ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
