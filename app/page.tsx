'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // ボタンクリック音のオーディオコンテキストとバッファ
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(true);

  // 音声の初期化（Web Audio APIで100%音量）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // AudioContextを作成
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // MP3ファイルを読み込み
      fetch('/button-click.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContextRef.current!.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          audioBufferRef.current = audioBuffer;
        })
        .catch(e => console.log('Audio loading failed:', e));
      
      // localStorageからクリック音の設定を読み込み
      const savedClickSound = localStorage.getItem('clickSoundEnabled');
      if (savedClickSound !== null) {
        setIsClickSoundEnabled(savedClickSound === 'true');
      }
    }
  }, []);

  // クリック音のオン/オフを切り替える
  const toggleClickSound = () => {
    const newValue = !isClickSoundEnabled;
    setIsClickSoundEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clickSoundEnabled', String(newValue));
    }
  };

  // 振動とクリック音の関数
  const playHapticAndSound = () => {
    // 振動 (Android のみ対応。iOSは未対応)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10); // 10ミリ秒の短い振動
    }
    
    // MP3クリック音を100%音量で再生（Web Audio API） - オン/オフ切り替え可能
    if (isClickSoundEnabled && audioContextRef.current && audioBufferRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        source.buffer = audioBufferRef.current;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        // 音量を100%に設定（ゲイン1.0）
        gainNode.gain.value = 1.0;
        
        source.start(0);
      } catch (e) {
        console.log('Audio playback failed:', e);
      }
    }
  };
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const exampleAudioRef = useRef<HTMLAudioElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [examplePlaybackSpeed, setExamplePlaybackSpeed] = useState('1');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showHelpCard, setShowHelpCard] = useState(false);
  const [dontShowHelpAgain, setDontShowHelpAgain] = useState(false);

  useEffect(() => {
    // ユーザー情報の取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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
    // localStorageから「ヘルプを表示しない」設定を読み込む
    // クライアント側でのみ実行
    if (typeof window !== 'undefined') {
      const savedDontShowHelp = localStorage.getItem('dontShowHelpAgain');
      if (savedDontShowHelp === 'true') {
        // 既に「表示しない」が設定されている場合は表示しない
        setDontShowHelpAgain(true);
        setShowHelpCard(false);
      } else {
        // 初回表示時のみヘルプカードを表示
        setShowHelpCard(true);
      }
    }
  }, []);

  const handleCloseHelpCard = () => {
    // チェックボックスがオンの場合のみlocalStorageに保存
    if (dontShowHelpAgain) {
      localStorage.setItem('dontShowHelpAgain', 'true');
    }
    setShowHelpCard(false);
  };

  const handleToggleDontShowHelp = (checked: boolean) => {
    setDontShowHelpAgain(checked);
    if (checked) {
      // チェックを入れたら即座にlocalStorageに保存してヘルプカードを閉じる
      localStorage.setItem('dontShowHelpAgain', 'true');
      setShowHelpCard(false);
    } else {
      // チェックを外したらlocalStorageから削除
      localStorage.removeItem('dontShowHelpAgain');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

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
        // カテゴリーを切り替えた時に検索結果をクリア
        setResult(null);
        setError(null);
        setSearchQuery('');
        // カテゴリーを選択したらメニューを閉じる
        if (isMobile) {
          setIsMenuOpen(false);
        }
      }
    }
  }, [selectedCategory, categories, isMobile]);

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
    playHapticAndSound(); // 振動と音を再生
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
        gap: isMobile ? '1rem' : '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* PC版: ログアウトボタン（右上固定） */}
        {!isMobile && user && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 1000
          }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ログアウト
            </button>
            <button
              onClick={toggleClickSound}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isClickSoundEnabled ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}
            </button>
          </div>
        )}

        {/* フロートヘルプカードのオーバーレイ */}
        {showHelpCard && (
          <div
            onClick={handleCloseHelpCard}
            onTouchStart={handleCloseHelpCard}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9998,
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
          />
        )}

        {/* フロートヘルプカード */}
        {showHelpCard && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: isMobile ? '1rem' : '2rem',
              right: isMobile ? '1rem' : '2rem',
              width: isMobile ? 'calc(100% - 2rem)' : '400px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'white',
              padding: isMobile ? '1rem' : '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 9999,
              fontSize: isMobile ? '0.875rem' : '0.9375rem',
              lineHeight: '1.75',
              display: 'block',
              pointerEvents: 'auto',
              touchAction: 'manipulation'
            }}
          >
            {/* 閉じるボタン */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: 'bold',
                margin: 0,
                flex: 1
              }}>
                ヘルプ
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseHelpCard();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseHelpCard();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '2rem' : '1.75rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: isMobile ? '0.5rem' : '0.25rem',
                  marginLeft: '1rem',
                  lineHeight: 1,
                  width: isMobile ? '2.5rem' : '2rem',
                  height: isMobile ? '2.5rem' : '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                  zIndex: 10000,
                  position: 'relative'
                }}
              >
                ×
              </button>
            </div>

            {/* ヘルプ内容 */}
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                広東語初心の方へ！ようこそスラング式カントン語音れんへ！
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                スラング先生考案!簡単指差し広東語☝️(全974単語)収録！
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  画面中央の広東語ボタンを押すと発音、音声が自動で表示されます
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  ジャンル分け(トータル73ジャンル収録)は右側のサイドバーを押して切り替えを行なってください
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  粤ピンとは香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  スラング式カタカナとは広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。
                </li>
              </ul>
              <p style={{ fontSize: isMobile ? '0.625rem' : '0.6875rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。
              </p>

              {/* チェックボックス */}
              <div style={{
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10000
              }}>
                <label
                  htmlFor="dontShowHelpAgain"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleDontShowHelp(!dontShowHelpAgain);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    padding: isMobile ? '1rem' : '0.75rem',
                    borderRadius: '8px',
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: isMobile ? '3.5rem' : 'auto'
                  }}
                >
                  <input
                    type="checkbox"
                    id="dontShowHelpAgain"
                    checked={dontShowHelpAgain}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleDontShowHelp(e.target.checked);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleDontShowHelp(!dontShowHelpAgain);
                    }}
                    style={{
                      width: isMobile ? '2rem' : '1.75rem',
                      height: isMobile ? '2rem' : '1.75rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      margin: 0
                    }}
                  />
                  <span style={{
                    fontSize: isMobile ? '1.125rem' : '1rem',
                    fontWeight: '500',
                    pointerEvents: 'none',
                    flex: 1,
                    textAlign: 'center'
                  }}>
                    ヘルプを表示しない
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem', flex: 1 }}>
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
                height: isMobile ? '3rem' : '3.5rem',
                fontSize: isMobile ? '1rem' : '1.125rem',
                width: '100%',
                padding: '0 1.25rem',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                marginBottom: '0.75rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#007AFF';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.15), inset 0 1px 0 rgba(255,255,255,0.9)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)';
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  playHapticAndSound();
                  handleSearch(searchQuery);
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  borderRadius: '12px',
                  background: loading ? 'linear-gradient(145deg, #d1d5db, #9ca3af)' : 'linear-gradient(145deg, #007AFF, #0051D5)',
                  color: 'white',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  boxShadow: loading ? '0 2px 6px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,122,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                  }
                }}
              >
                {loading ? '検索中...' : '広東語発音'}
              </button>
              <button
                onClick={() => {
                  playHapticAndSound();
                  handleTranslateAndConvert(searchQuery);
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  borderRadius: '12px',
                  background: loading ? 'linear-gradient(145deg, #d1d5db, #9ca3af)' : 'linear-gradient(145deg, #34C759, #248A3D)',
                  color: 'white',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  boxShadow: loading ? '0 2px 6px rgba(0,0,0,0.1)' : '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(52,199,89,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                  }
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
              <div 
                dangerouslySetInnerHTML={{ __html: currentCategory.introContent }} 
                style={isMobile ? {
                  fontSize: '0.875rem'
                } : {}}
                className={isMobile ? 'intro-content-mobile' : ''}
              />
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWordClick(word);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWordClick(word);
                        }}
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
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          touchAction: 'manipulation',
                          position: 'relative',
                          zIndex: 2
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWordClick(word);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWordClick(word);
                  }}
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                    padding: isMobile ? '1rem' : '1.25rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                    height: isMobile ? '110px' : '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    border: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                  }}
                >
                  <strong style={{ 
                    fontSize: isMobile ? '1.5rem' : '1.875rem',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '0.25rem'
                  }}>
                    {word.chinese}
                  </strong>
                  <div style={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: '#6e6e73',
                    fontWeight: '400'
                  }}>
                    {word.japanese}
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* サイドバー */}
        {isMobile ? (
          // モバイル: フロートメニュー
          <>
            {/* オーバーレイ */}
            {isMenuOpen && (
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 9998,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
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
                zIndex: 9999,
                transition: 'right 0.3s ease',
                overflowY: 'auto',
                padding: '1rem',
                pointerEvents: 'auto'
              }}
            >
              {/* ログアウトボタン（モバイル） */}
              {user && (
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      marginBottom: '0.5rem'
                    }}
                  >
                    ログアウト
                  </button>
                  <button
                    onClick={toggleClickSound}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: isClickSoundEnabled ? '#10b981' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}
                  </button>
                </div>
              )}

              {/* ロゴ */}
              <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                <a 
                  href="https://line.me/R/ti/p/@298mwivr" 
            target="_blank"
            rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    textDecoration: 'none'
                  }}
                >
                  <img 
                    src="/line-logo.png"
                    alt="スラング先生ロゴ"
                    style={{ 
                      height: 'auto', 
                      width: '100%',
                      maxWidth: '200px',
                      display: 'block',
                      margin: '0 auto'
                    }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory(category.id);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory(category.id);
                    }}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      borderRadius: '4px',
                      backgroundColor: selectedCategory === category.id ? '#e5e7eb' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      pointerEvents: 'auto',
                      touchAction: 'manipulation',
                      position: 'relative',
                      zIndex: 2
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

            {/* フロートボタン */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              style={{
                position: 'fixed',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                userSelect: 'none'
              }}
            >
              ≡
            </button>
          </>
        ) : (
          // デスクトップ: 通常のサイドバー
          <div style={{ 
            borderLeft: '1px solid #d1d5db',
            paddingLeft: '1rem'
          }}>
            {/* ロゴ */}
            <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
              <a 
                href="https://line.me/R/ti/p/@298mwivr" 
            target="_blank"
            rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}
              >
                  <img 
                    src="/line-logo.png"
                    alt="スラング先生ロゴ"
                    style={{
                      height: 'auto',
                      width: '100%',
                      maxWidth: '200px',
                      display: 'block',
                      margin: '0 auto'
                    }}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playHapticAndSound();
                    setSelectedCategory(category.id);
                  }}
                  style={{
                    padding: '0.5rem',
                    textAlign: 'left',
                    borderRadius: '4px',
                    backgroundColor: selectedCategory === category.id ? '#e5e7eb' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 2
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

          </div>
        )}
      </div>
    </div>
  );
}
