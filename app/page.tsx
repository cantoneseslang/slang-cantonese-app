/**
 * ⚠️ 重要：このファイルはメインページ（ホームページ）の全機能を含みます
 * 
 * このファイルは意図しない変更を防ぐため保護されています。
 * マージや自動修正時には注意が必要です。
 * 
 * このファイルには以下の重要な機能が含まれています：
 * - カテゴリー・単語表示機能
 * - 音声再生機能
 * - 検索機能
 * - 学習モード
 * - お気に入り機能
 * - ユーザー設定（メニュー、プラン表示など）
 * - Note記事連携機能
 * 
 * 変更する場合は必ず以下を確認してください：
 * - 変更内容が正しいか
 * - 既存の機能が壊れていないか
 * - 過去のコミット履歴で意図しない変更が入っていないか
 * 
 * このファイルを簡易版に戻したり、主要機能を削除しないでください。
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import categoriesData from '@/data/categories.json';
import noteCategoriesData from '@/data/note-categories.json';

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
  originalText?: string | null;
  translatedText?: string | null;
}

interface Word {
  chinese: string;
  japanese: string;
  jyutping?: string; // Note記事から取得した場合は必須
  katakana?: string; // Note記事から取得した場合は必須
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
  const [blueLoading, setBlueLoading] = useState(false);
  const [greenLoading, setGreenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Noteフレーズ機能の状態
  const [showNoteSubCategories, setShowNoteSubCategories] = useState(false);
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string | null>(null);
  const noteSubCategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showNoteSubLeftArrow, setShowNoteSubLeftArrow] = useState(false);
  const [showNoteSubRightArrow, setShowNoteSubRightArrow] = useState(true);
  
  // 長文の場合の粤ピン・カタカナ表示/非表示
  const [showPronunciationDetails, setShowPronunciationDetails] = useState(true);
  
  // コピー成功メッセージ表示用
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // 総ボタン数（categories.json から動的集計、管理画面と同期）
  const totalButtons = useMemo(() => {
    try {
      const data: Category[] = (categoriesData as unknown) as Category[]
      let total = 0
      for (const c of data) {
        if (!c || c.id === 'pronunciation') continue
        if (Array.isArray(c.words)) total += c.words.length
        if (Array.isArray(c.practiceGroups)) {
          for (const g of c.practiceGroups) {
            if (g && Array.isArray(g.words)) total += g.words.length
          }
        }
      }
      return total
    } catch {
      return 0
    }
  }, []);

  // ボタンクリック音のオーディオコンテキストとバッファ
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(true);
  
  // 学習モードの状態（デフォルト: false = ノーマルモード）
  const [isLearningMode, setIsLearningMode] = useState(false);
  
  // ノーマルモードでアクティブな単語のID（緑色のボタン）- 1つだけアクティブ
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  // 設定画面の状態
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // ユーザーネーム編集の状態
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  
  // 会員種別の状態
  const [membershipType, setMembershipType] = useState<'free' | 'subscription' | 'lifetime'>('free');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'subscription' | 'lifetime' | null>(null);
  const [isDowngrade, setIsDowngrade] = useState(false); // ダウングレードかどうか
  const pricingModalScrollRef = useRef<HTMLDivElement>(null);
  const [showPricingModalTopArrow, setShowPricingModalTopArrow] = useState(false);
  const [showPricingModalBottomArrow, setShowPricingModalBottomArrow] = useState(false);
  
  // デフォルトカテゴリー設定の状態
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('pronunciation'); // デフォルトは「発音表記について」
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSavingDefaultCategory, setIsSavingDefaultCategory] = useState(false);
  const categoryPickerScrollRef = useRef<HTMLDivElement>(null);
  
  // デバッグ情報の状態
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loadingDebugInfo, setLoadingDebugInfo] = useState(false);

  // アカウントメニュー表示
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  // お気に入りの状態
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // "categoryId:wordChinese" 形式
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressWordRef = useRef<{word: Word, categoryId: string} | null>(null);

  // 隠しモード（同時通訳モード）の状態
  const [isHiddenMode, setIsHiddenMode] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeLogoRef = useRef<HTMLImageElement | null>(null);
  const isPlayingSoundRef = useRef(false);
  const [showTitle, setShowTitle] = useState(false);
  const titleAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // 音声認識の状態
  const [recognizedText, setRecognizedText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [recognizedTextLines, setRecognizedTextLines] = useState<string[]>([]); // 新しいテキストが上に来る配列
  const [translatedTextLines, setTranslatedTextLines] = useState<string[]>([]); // 広東語翻訳の配列（新しいものが上）
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const translateDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const translateAbortControllerRef = useRef<AbortController | null>(null);
  const lastTranslatedTextRef = useRef<string>('');
  const lastProcessedFinalTextRef = useRef<string>('');

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

  // 音声認識の初期化（Web Speech API）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 音声認識APIが利用可能かチェック
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (SpeechRecognition) {
        // 既に初期化されている場合はスキップ
        if (recognitionRef.current) {
          return;
        }
        
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'ja-JP';
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onresult = (event: any) => {
            let interim = '';
            let newFinal = '';
            
            // resultIndexから新しい結果のみを処理
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                // finalの結果を集約
                newFinal += transcript;
              } else {
                // interimは最新のもののみ（上書き）
                interim = transcript;
              }
            }
            
            // interimのテキストを更新
            setInterimText(interim);
            
            if (newFinal) {
              const trimmed = newFinal.trim();
              
              // 直前のfinalテキストと比較（重複チェック - 完全一致のみ）
              if (trimmed === lastProcessedFinalTextRef.current && trimmed.length > 0) {
                // 完全に同じテキストの場合のみスキップ
                setInterimText('');
                return;
              }
              
              lastProcessedFinalTextRef.current = trimmed;
              
              // finalのテキストを追加
              setFinalText(prev => {
                const result = prev + trimmed + ' ';
                return result;
              });
              
              setRecognizedText(prev => {
                // 既存のテキストからinterim部分を除去してから追加
                let baseText = prev;
                if (interim && baseText.includes(interim)) {
                  // interim部分を除去（最後の出現のみ）
                  const lastIndex = baseText.lastIndexOf(interim);
                  if (lastIndex !== -1) {
                    baseText = baseText.substring(0, lastIndex) + baseText.substring(lastIndex + interim.length);
                  }
                }
                baseText = baseText.trim();
                
                // finalテキストを追加
                return baseText + (baseText ? ' ' : '') + trimmed;
              });
              
              // finalが確定したら必ず新しい行として追加（上に表示）
              setRecognizedTextLines(prev => {
                // 既に同じテキストが先頭にある場合はスキップ（重複防止）
                if (prev.length > 0 && prev[0] === trimmed) {
                  return prev;
                }
                // 新しい行を先頭に追加（マイク押すたびに改行）
                return [trimmed, ...prev].slice(0, 50); // 最大50行まで保持
              });
              
              setInterimText('');
            } else if (interim) {
              // interimのみの場合 - 最新のinterimを表示（確定するまで更新）
              setRecognizedText(prev => {
                // 既存のfinalText部分を保持し、interim部分を更新
                const baseText = prev.trim();
                // interimの最後の部分を上書き（最新のinterimを表示）
                return baseText + (baseText ? ' ' : '') + interim;
              });
              
              // interimは配列に追加しない（確定後に追加される）
              // 表示はinterimTextステートで行う
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            // abortedエラーは無視（意図的な停止の場合）
            if (event.error !== 'aborted') {
              console.error('音声認識エラー:', event.error);
              setIsRecording(false);
            }
          };

          recognitionRef.current.onend = () => {
            // 長押し方式なので、onendで自動再開しない
            console.log('音声認識終了');
          };
          
          console.log('音声認識を初期化しました');
        } catch (e) {
          console.error('音声認識初期化エラー:', e);
        }
      } else {
        console.warn('音声認識APIが利用できません');
      }
    }
  }, []); // 依存配列を空にして、一度だけ初期化

  // 翻訳APIの呼び出し（最速同時通訳対応、リアルタイム翻訳）
  useEffect(() => {
    // recognizedTextLinesの最新のテキストを翻訳（interimも含む）
    const latestText = recognizedTextLines.length > 0 ? recognizedTextLines[0] : (recognizedText.trim() || interimText.trim());
    
    if (!isHiddenMode || !latestText.trim()) {
      setTranslatedText('');
      return;
    }

    // 前回のデバウンスタイマーをキャンセル
    if (translateDebounceRef.current) {
      clearTimeout(translateDebounceRef.current);
    }

    // 前回の翻訳リクエストをキャンセル（AbortController使用）
    if (translateAbortControllerRef.current) {
      translateAbortControllerRef.current.abort();
    }

    // 新しいAbortControllerを作成
    translateAbortControllerRef.current = new AbortController();

    // デバウンス時間を大幅に短縮（50ms）で最速リアルタイム処理
    translateDebounceRef.current = setTimeout(async () => {
      try {
        const textToTranslate = latestText.trim();
        if (!textToTranslate) return;

        // 直前の翻訳と同じテキストの場合はスキップ（無駄なリクエストを防ぐ）
        // ただし、interimの場合や短いテキストの場合は常に翻訳
        if (textToTranslate === lastTranslatedTextRef.current && textToTranslate.length > 10) {
          return;
        }

        lastTranslatedTextRef.current = textToTranslate;

        // 高速翻訳リクエスト（AbortControllerでキャンセル可能）
        const abortController = translateAbortControllerRef.current;
        if (!abortController) {
          return; // AbortControllerが存在しない場合は終了
        }

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Priority': 'high' // ブラウザに優先度を指示
          },
          body: JSON.stringify({ text: textToTranslate }),
          signal: abortController.signal,
          // Keep-Aliveで接続を維持（高速化）
          keepalive: true
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.translated || data.translatedText || '';
          if (translated) {
            setTranslatedText(translated);
            // 新しい翻訳を配列の先頭に追加（上に表示）
            setTranslatedTextLines(prev => {
              // 既に同じテキストが先頭にある場合はスキップ
              if (prev.length > 0 && prev[0] === translated) {
                return prev;
              }
              return [translated, ...prev].slice(0, 50); // 最大50行まで保持
            });
          }
        } else {
          console.error('翻訳APIエラー:', response.status);
        }
      } catch (error: any) {
        // AbortErrorは無視（キャンセルされた場合は正常）
        if (error.name !== 'AbortError') {
          console.error('翻訳エラー:', error);
        }
      } finally {
        translateAbortControllerRef.current = null;
      }
    }, 50); // 50msデバウンス（最速リアルタイム処理）

    return () => {
      if (translateDebounceRef.current) {
        clearTimeout(translateDebounceRef.current);
      }
      if (translateAbortControllerRef.current) {
        translateAbortControllerRef.current.abort();
      }
    };
  }, [recognizedTextLines, recognizedText, interimText, isHiddenMode]);

  // 隠しモード終了処理
  const exitHiddenMode = () => {
    setIsHiddenMode(false);
    setIsRecording(false);
    setRecognizedText('');
    setFinalText('');
    setInterimText('');
    setTranslatedText('');
    setRecognizedTextLines([]);
    setTranslatedTextLines([]);
    setShowTitle(false);
    lastTranslatedTextRef.current = '';
    lastProcessedFinalTextRef.current = '';
    
    // 翻訳リクエストをキャンセル
    if (translateDebounceRef.current) {
      clearTimeout(translateDebounceRef.current);
      translateDebounceRef.current = null;
    }
    if (translateAbortControllerRef.current) {
      translateAbortControllerRef.current.abort();
      translateAbortControllerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('音声認識停止エラー:', e);
      }
    }
    if (titleAudioRef.current) {
      titleAudioRef.current.pause();
      titleAudioRef.current.currentTime = 0;
    }
  };

  // ESCキーで隠しモード終了
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHiddenMode) {
        exitHiddenMode();
      }
    };

    if (isHiddenMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isHiddenMode]);

  // 隠しモード起動後、全てのUI要素が表示された後にタイトルを表示
  useEffect(() => {
    if (isHiddenMode) {
      // 最後のアニメーション（日本語エリア: 0.8s）が完了してから、少し待ってタイトルを表示
      const timer = setTimeout(() => {
        setShowTitle(true);
        
        // タイトル表示と同時に音声を再生
        if (titleAudioRef.current) {
          titleAudioRef.current.currentTime = 0;
          titleAudioRef.current.play().catch((e) => {
            console.error('タイトル音声再生エラー:', e);
          });
        }
      }, 1000); // 0.8s + 0.2s の余裕

      return () => clearTimeout(timer);
    } else {
      setShowTitle(false);
      if (titleAudioRef.current) {
        titleAudioRef.current.pause();
        titleAudioRef.current.currentTime = 0;
      }
    }
  }, [isHiddenMode]);

  // マイクボタンのハンドラー（長押し方式）
  const handleMicPress = () => {
    if (!isHiddenMode) {
      console.log('隠しモードではないため、マイク機能は無効です');
      return;
    }
    
    // 既に録音中の場合は何もしない
    if (isRecording) {
      console.log('既に録音中です');
      return;
    }
    
    // 音声認識が初期化されていない場合は再初期化
    if (!recognitionRef.current) {
      console.log('音声認識を再初期化します');
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'ja-JP';
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

              recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                // 全ての結果を処理（resultIndexから最後まで）
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  const transcript = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                    // final結果を追加（空白で区切る）
                    finalTranscript += (finalTranscript ? ' ' : '') + transcript;
                  } else {
                    // interim結果は最新のものを保持（上書き）
                    interimTranscript = transcript;
                  }
                }
                
                // interim結果を表示
                setInterimText(interimTranscript);
                
                // final結果がある場合
                if (finalTranscript) {
                  const trimmedFinal = finalTranscript.trim();
                  
                  // 直前のfinalテキストと完全一致する場合はスキップ（重複防止）
                  if (trimmedFinal === lastProcessedFinalTextRef.current) {
                    setInterimText('');
                    return;
                  }
                  
              lastProcessedFinalTextRef.current = trimmedFinal;
              
              // finalTextに追加
              setFinalText(prev => prev + trimmedFinal + ' ');
              
              // 新しいテキストを配列の先頭に追加（上に表示）
              setRecognizedTextLines(prev => [trimmedFinal, ...prev].slice(0, 50)); // 最大50行まで保持
              
              // recognizedTextも更新（下位互換のため）
              setRecognizedText(prev => {
                // 現在のrecognizedTextからinterim部分を除去
                let cleanText = prev;
                if (interimTranscript && cleanText.includes(interimTranscript)) {
                  const lastInterimIndex = cleanText.lastIndexOf(interimTranscript);
                  if (lastInterimIndex !== -1) {
                    cleanText = cleanText.substring(0, lastInterimIndex) + 
                               cleanText.substring(lastInterimIndex + interimTranscript.length);
                  }
                }
                cleanText = cleanText.trim();
                
                // finalテキストを追加（下位互換のため）
                return cleanText + (cleanText ? ' ' : '') + trimmedFinal;
              });
              
              setInterimText('');
            } else if (interimTranscript) {
              // interimのみの場合
              setRecognizedText(prev => {
                // 既存のfinalTextを保持し、interim部分を更新
                const finalPart = prev.trim();
                // interim部分を追加（既存のinterim部分は上書き）
                return finalPart + (finalPart ? ' ' : '') + interimTranscript;
              });
            }
              };

          recognitionRef.current.onerror = (event: any) => {
            if (event.error !== 'aborted') {
              console.error('音声認識エラー:', event.error);
              setIsRecording(false);
            }
          };

          recognitionRef.current.onend = () => {
            // 長押し方式なので、onendで自動再開しない
            // ユーザーがボタンを離したら停止する
            console.log('音声認識終了（ボタン離された）');
          };
        }
      }
    }
    
    console.log('音声認識を開始します（長押し）');
    setIsRecording(true);
    
    // 少し待ってから開始（状態更新を確実にするため）
    setTimeout(() => {
      // recognitionRef.currentを直接チェック（isRecordingの状態に依存しない）
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('音声認識開始成功');
        } catch (e: any) {
          console.error('音声認識開始エラー:', e);
          // エラーメッセージを確認
          if (e.message && e.message.includes('already')) {
            console.log('音声認識は既に開始されています');
          } else {
            console.error('音声認識開始に失敗:', e.message || e);
            setIsRecording(false);
          }
        }
      } else {
        console.error('音声認識が初期化できませんでした - recognitionRef.current:', recognitionRef.current);
        setIsRecording(false);
        // 再初期化を試みる
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (SpeechRecognition) {
            try {
              recognitionRef.current = new SpeechRecognition();
              recognitionRef.current.lang = 'ja-JP';
              recognitionRef.current.continuous = true;
              recognitionRef.current.interimResults = true;
              
              recognitionRef.current.onresult = (event: any) => {
                let interim = '';
                let newFinal = '';
                
                // resultIndexから新しい結果のみを処理（重複を防ぐ）
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  const transcript = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                    // finalの結果は新しいもののみ追加
                    newFinal += transcript;
                  } else {
                    // interimは常に最新のものを表示
                    interim = transcript;
                  }
                }
                
                // interimのテキストを更新
                setInterimText(interim);
                
                if (newFinal) {
                  // finalのテキストを追加（重複チェックなし、新しいfinalのみ追加）
                  setFinalText(prev => {
                    // 既に追加済みのテキストと重複していないかチェック
                    const trimmed = newFinal.trim();
                    if (prev.endsWith(trimmed + ' ')) {
                      // 既に追加済みの場合は追加しない
                      return prev;
                    }
                    return prev + trimmed + ' ';
                  });
                  
                  setRecognizedText(prev => {
                    // interimテキストを除去してから追加
                    const baseText = prev.replace(interim, '').trim();
                    const trimmed = newFinal.trim();
                    if (baseText.endsWith(trimmed)) {
                      return baseText;
                    }
                    return baseText + (baseText ? ' ' : '') + trimmed;
                  });
                  
                  setInterimText('');
                } else if (interim) {
                  // interimのみの場合、finalTextにinterimを追加して表示
                  setRecognizedText(prev => {
                    // 既存のfinalTextを保持し、interimを追加
                    const baseText = prev.trim();
                    return baseText + (baseText ? ' ' : '') + interim;
                  });
                }
              };
              
              recognitionRef.current.onerror = (event: any) => {
                if (event.error !== 'aborted') {
                  console.error('音声認識エラー:', event.error);
                  setIsRecording(false);
                }
              };
              
              recognitionRef.current.onend = () => {
                console.log('音声認識終了');
              };
              
              // 再初期化後、再度開始を試みる
              setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                    console.log('音声認識再初期化後に開始成功');
                  } catch (e: any) {
                    console.error('再初期化後の音声認識開始エラー:', e);
                    setIsRecording(false);
                  }
                }
              }, 100);
            } catch (e) {
              console.error('音声認識再初期化エラー:', e);
              setIsRecording(false);
            }
          }
        }
      }
    }, 200);
  };

  const handleMicRelease = () => {
    if (!isHiddenMode) {
      console.log('隠しモードではないため、マイク機能は無効です');
      return;
    }
    
    // 録音中でない場合は何もしない
    if (!isRecording) {
      console.log('録音中ではないため、停止処理をスキップします');
      return;
    }
    
    console.log('音声認識を停止します（ボタン離された）');
    setIsRecording(false);
    
    // 最後のinterimテキストがあれば、確定して新しい行に追加
    if (interimText.trim()) {
      const finalInterim = interimText.trim();
      setRecognizedTextLines(prev => {
        // 既に同じテキストが先頭にある場合はスキップ
        if (prev.length > 0 && prev[0] === finalInterim) {
          return prev;
        }
        // マイクを離した時に確定して新しい行に追加
        return [finalInterim, ...prev].slice(0, 50);
      });
      setInterimText('');
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('音声認識停止成功');
      } catch (e: any) {
        // 停止エラーは無視（既に停止されている場合）
        if (e.message && !e.message.includes('not started')) {
          console.error('音声認識停止エラー:', e);
        } else {
          console.log('音声認識は既に停止されています');
        }
      }
    }
  };

  // クリック音のオン/オフを切り替える
  const toggleClickSound = () => {
    const newValue = !isClickSoundEnabled;
    setIsClickSoundEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clickSoundEnabled', String(newValue));
    }
  };

  // 学習モードのオン/オフを切り替える
  const toggleLearningMode = () => {
    setIsLearningMode(!isLearningMode);
    // モードを切り替えたらアクティブな単語をクリア
    setActiveWordId(null);
  };

  // ユーザーの会員種別を取得と初期値設定
  useEffect(() => {
    const initializeUserMetadata = async () => {
      if (!user) return;

      // 会員種別の設定
      if (user.user_metadata?.membership_type) {
        setMembershipType(user.user_metadata.membership_type);
      } else {
        // 会員種別がない場合、デフォルト値を設定
        setMembershipType('free');
      }
      
      // デフォルトカテゴリーの設定
      if (user.user_metadata?.default_category_id) {
        console.log('📋 デフォルトカテゴリーを読み込み:', user.user_metadata.default_category_id);
        setDefaultCategoryId(user.user_metadata.default_category_id);
      } else {
        // デフォルトカテゴリーがない場合、デフォルト値（pronunciation）を設定
        console.log('📋 デフォルトカテゴリーが未設定、デフォルト値（pronunciation）を使用');
        setDefaultCategoryId('pronunciation');
      }

      // ユーザーネームまたは会員種別がない場合、Supabaseに初期値を設定
      const needsUsername = !user.user_metadata?.username;
      const needsMembershipType = !user.user_metadata?.membership_type;

      if (needsUsername || needsMembershipType) {
        console.log('初期値を設定中...');
        try {
          const updates: any = {};
          

          if (needsUsername) {
            // メールのローカル部分をユーザーネームとして使用
            const defaultUsername = user.email?.split('@')[0] || 'user';
            updates.username = defaultUsername;
          }
          
          if (needsMembershipType) {
            updates.membership_type = 'free';
          }

          const { error } = await supabase.auth.updateUser({
            data: updates
          });

          if (error) {
            console.error('初期値設定エラー:', error);
          } else {
            console.log('✅ 初期値設定完了:', updates);
            // ページをリロードして最新情報を取得
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (err) {
          console.error('初期値設定失敗:', err);
        }
      }
    };

    initializeUserMetadata();
  }, [user]);

  // お気に入りの読み込み関数（外部から呼び出し可能にする）
  const loadFavorites = async () => {
    if (!user) {
      console.log('📋 お気に入り読み込み: ユーザー未ログイン');
      setFavorites(new Set());
      return;
    }

    try {
      console.log('📋 お気に入り読み込み開始');
      setLoadingFavorites(true);
      const response = await fetch('/api/favorites/list');
      const data = await response.json();
      
      console.log('📋 お気に入り読み込みAPIレスポンス:', { status: response.status, data });
      
      if (data.favorites && Array.isArray(data.favorites)) {
        // お気に入りリストをSetに変換（型アサーションでstring[]として扱う）
        const favoritesSet = new Set<string>(data.favorites as string[]);
        console.log('✅ お気に入り読み込み成功:', { 
          count: favoritesSet.size, 
          favorites: Array.from(favoritesSet).slice(0, 10),
          allFavorites: Array.from(favoritesSet) // デバッグ用：全お気に入りを表示
        });
        setFavorites(favoritesSet);
        // 状態更新を確認
        console.log('📋 setFavorites呼び出し完了、次のレンダリングで反映されます');
      } else if (data.error) {
        // エラーがあっても静かに処理（テーブルが存在しない場合など）
        console.warn('⚠️ お気に入り読み込み警告:', data.error);
        setFavorites(new Set());
      } else {
        console.log('📋 お気に入り読み込み: データなし');
        setFavorites(new Set());
      }
    } catch (error) {
      // ネットワークエラーなどは静かに処理
      console.error('❌ お気に入り読み込みエラー:', error);
      setFavorites(new Set());
    } finally {
      setLoadingFavorites(false);
    }
  };

  // お気に入りの読み込み（初回ロード時）
  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // お気に入りの追加/削除
  const toggleFavorite = async (word: Word, categoryId: string) => {
    if (!user) {
      console.warn('お気に入り登録: ユーザーがログインしていません');
      return; // ログインしていない場合は静かに処理
    }

    // categoryIdが空の場合は警告を出す
    if (!categoryId || categoryId.trim() === '') {
      console.error('categoryIdが空です。word:', word, 'currentCategory:', currentCategory, 'selectedNoteCategory:', selectedNoteCategory, 'selectedCategory:', selectedCategory);
      alert('エラー: カテゴリーIDが取得できませんでした。ページをリロードしてください。');
      return;
    }

    // デバッグログ（本番環境では削除推奨）
    console.log('🔍 お気に入り登録試行:', {
      wordChinese: word.chinese,
      wordJapanese: word.japanese,
      categoryId,
      selectedNoteCategory,
      currentCategoryId: currentCategory?.id,
      selectedCategory
    });

    const favoriteKey = `${categoryId}:${word.chinese}`;
    const isFavorite = favorites.has(favoriteKey);
    
    console.log('📌 お気に入り状態:', { favoriteKey, isFavorite, favoritesSize: favorites.size });

    try {
      if (isFavorite) {
        // 削除
        const response = await fetch('/api/favorites/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordChinese: word.chinese,
            categoryId: categoryId
          })
        });

        const data = await response.json();
        console.log('📥 お気に入り削除APIレスポンス:', { status: response.status, data });
        if (data.success) {
          console.log('✅ お気に入り削除成功');
          // お気に入りリストを再読み込みして最新状態を反映
          await loadFavorites();
        } else {
          console.error('❌ お気に入り削除失敗:', data);
          // テーブル未作成の場合はエラーを表示
          if (data.requiresTable || (data.error && (data.error.includes('テーブル') || data.error.includes('Could not find the table') || data.error.includes('schema cache')))) {
            alert(`⚠️ お気に入り機能を使用するには、Supabaseでテーブルを作成する必要があります。\n\n${data.details || 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。'}\n\n※ テーブル作成後、ページをリロードしてください。`);
            return; // ローカル状態から削除しない
          } else {
            const errorMsg = data.error || data.message || 'お気に入りの削除に失敗しました';
            if (errorMsg.includes('Could not find') || errorMsg.includes('schema cache') || errorMsg.includes('relation')) {
              alert(`⚠️ お気に入り機能を使用するには、Supabaseでテーブルを作成する必要があります。\n\nSupabaseのSQL Editorで docs/favorites-table.sql を実行してください。\n\n※ テーブル作成後、ページをリロードしてください。`);
            } else {
              alert(errorMsg);
            }
          }
        }
      } else {
        // 追加
        // 会員種別による制限チェック（早期チェック - UX向上のため）
        // 注意: 最終的な制限チェックはバックエンドで行われる
        if (membershipType === 'free' && favorites.size >= 6) {
          alert('ブロンズ会員は6個までしかお気に入りを登録できません。');
          return;
        }

        const response = await fetch('/api/favorites/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordChinese: word.chinese,
            wordJapanese: word.japanese,
            categoryId: categoryId
          })
        });

        const data = await response.json();
        
        console.log('📥 APIレスポンス:', { status: response.status, data });
        
        // レスポンスステータスをチェック（403は制限エラー）
        if (response.status === 403) {
          // バックエンドからの制限エラーを表示
          const errorMsg = data.error || 'ブロンズ会員はお気に入りを6個までしか保存できません。';
          console.warn('⚠️ お気に入り登録制限:', errorMsg);
          alert(errorMsg);
          return;
        }
        
        if (data.success) {
          console.log('✅ お気に入り登録成功');
          // お気に入りリストを再読み込みして最新状態を反映
          await loadFavorites();
        } else {
          console.error('❌ お気に入り登録失敗:', data);
          // テーブル未作成の場合は明確にエラーを表示
          if (data.requiresTable || (data.error && (data.error.includes('テーブル') || data.error.includes('Could not find the table') || data.error.includes('schema cache')))) {
            alert(`⚠️ お気に入り機能を使用するには、Supabaseでテーブルを作成する必要があります。\n\n${data.details || 'SupabaseのSQL Editorで docs/favorites-table.sql を実行してください。'}\n\n※ テーブル作成後、ページをリロードしてください。`);
            return; // ローカル状態には追加しない
          } else if ((data.error || '').includes('既にお気に入りに登録されています')) {
            // 既に登録されている場合は静かに処理
            console.warn('既にお気に入りに登録されています');
          } else {
            // その他のエラーは表示（ただし、テーブル未検出の可能性もチェック）
            const errorMsg = data.error || data.message || 'お気に入りの追加に失敗しました';
            if (errorMsg.includes('Could not find') || errorMsg.includes('schema cache') || errorMsg.includes('relation')) {
              alert(`⚠️ お気に入り機能を使用するには、Supabaseでテーブルを作成する必要があります。\n\nSupabaseのSQL Editorで docs/favorites-table.sql を実行してください。\n\n※ テーブル作成後、ページをリロードしてください。`);
            } else {
              alert(errorMsg);
            }
          }
        }
      }
    } catch (error: any) {
      // ネットワークエラーなどは静かに処理
      console.error('お気に入り操作エラー:', error);
    }
  };

  // 長押し処理用のフラグ
  const longPressCompletedRef = useRef(false);
  
  // 長押し開始
  const handleLongPressStart = (word: Word, categoryId: string, e: React.TouchEvent | React.MouseEvent) => {
    // 既に長押しが進行中の場合は処理しない
    if (longPressTimerRef.current) {
      return;
    }
    
    // デバッグログ
    console.log('👆 長押し開始:', { wordChinese: word.chinese, categoryId, selectedNoteCategory, currentCategoryId: currentCategory?.id });
    
    longPressCompletedRef.current = false;
    longPressWordRef.current = { word, categoryId };
    
    longPressTimerRef.current = setTimeout(() => {
      if (longPressWordRef.current) {
        longPressCompletedRef.current = true;
        playHapticAndSound();
        console.log('⏰ 長押し完了、お気に入り登録実行:', { 
          wordChinese: longPressWordRef.current.word.chinese, 
          categoryId: longPressWordRef.current.categoryId 
        });
        toggleFavorite(longPressWordRef.current.word, longPressWordRef.current.categoryId);
        // タイマーと参照をクリア
        longPressTimerRef.current = null;
        longPressWordRef.current = null;
      }
    }, 800); // 800ms長押し（少し長めに）
  };

  // 長押し終了
  const handleLongPressEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    const wasLongPress = longPressCompletedRef.current;
    
    // 長押しが完了していた場合のみイベントを止める
    if (wasLongPress) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // フラグを少し遅延してリセット（onClickを防ぐため）
      setTimeout(() => {
        longPressCompletedRef.current = false;
      }, 300);
    } else {
      // 長押しが完了していない場合はタイマーをクリア（通常クリックを許可）
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressWordRef.current = null;
      longPressCompletedRef.current = false;
    }
  };

  // ユーザーネーム変更処理
  const handleUsernameChange = async () => {
    console.log('=== ユーザーネーム変更開始 ===');
    setUsernameError(null);
    setUsernameSuccess(false);

    // 入力チェック
    if (!newUsername || newUsername.trim() === '') {
      const errorMsg = 'ユーザーネームを入力してください';
      console.log('エラー:', errorMsg);
      setUsernameError(errorMsg);
      alert(errorMsg);
      return;
    }

    // 長さチェック
    if (newUsername.length < 2) {
      const errorMsg = 'ユーザーネームは2文字以上である必要があります';
      console.log('エラー:', errorMsg);
      setUsernameError(errorMsg);
      alert(errorMsg);
      return;
    }

    if (newUsername.length > 50) {
      const errorMsg = 'ユーザーネームは50文字以内である必要があります';
      console.log('エラー:', errorMsg);
      setUsernameError(errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      console.log('Supabaseでユーザーネーム更新を実行...');
      const { data, error } = await supabase.auth.updateUser({
        data: {
          username: newUsername.trim()
        }
      });

      console.log('Supabase応答 - data:', data);
      console.log('Supabase応答 - error:', error);

      if (error) {
        console.error('Supabaseエラー詳細:', error);
        throw error;
      }

      console.log('✅ ユーザーネーム変更成功！');
      setUsernameSuccess(true);
      setIsEditingUsername(false);
      alert('✅ ユーザーネームが正常に変更されました！');
      
      // ページをリロードしてユーザー情報を更新
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('❌ ユーザーネーム変更エラー:', err);
      
      // エラーを完全に日本語化
      const errorMessage = err?.message || err?.error?.message || '';
      const msg = errorMessage.toLowerCase();
      
      let errorMsg = 'ユーザーネーム変更に失敗しました';
      
      // 既に使用されている
      if (msg.includes('already') || msg.includes('exists') || msg.includes('taken')) {
        errorMsg = 'このユーザーネームは既に使用されています';
      }
      // 無効な文字
      else if (msg.includes('invalid') || msg.includes('forbidden') || msg.includes('not allowed')) {
        errorMsg = 'ユーザーネームに使用できない文字が含まれています';
      }
      // 長さエラー
      else if (msg.includes('length') || msg.includes('too long') || msg.includes('too short')) {
        errorMsg = 'ユーザーネームは2文字以上50文字以内である必要があります';
      }
      // セッションエラー
      else if (msg.includes('session') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('unauthenticated')) {
        errorMsg = 'セッションが無効です。再度ログインしてください';
      }
      // ネットワークエラー
      else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        errorMsg = 'ネットワークエラーが発生しました。接続を確認してください';
      }
      // その他のエラー（英語メッセージは表示しない）
      else if (errorMessage) {
        errorMsg = 'ユーザーネーム変更に失敗しました。入力内容を確認してください';
      }
      
      setUsernameError(errorMsg);
      alert('❌ ' + errorMsg);
    }
    
    console.log('=== ユーザーネーム変更処理終了 ===');
  };

  // パスワード変更処理
  const handlePasswordChange = async () => {
    console.log('=== パスワード変更開始 ===');
    console.log('新しいパスワード:', newPassword ? '入力あり' : '入力なし');
    console.log('確認パスワード:', confirmPassword ? '入力あり' : '入力なし');
    
    setPasswordError(null);
    setPasswordSuccess(false);

    // 入力チェック
    if (!newPassword || !confirmPassword) {
      const errorMsg = 'パスワードを入力してください';
      console.log('エラー:', errorMsg);
      setPasswordError(errorMsg);
      alert(errorMsg);
      return;
    }

    // パスワードバリデーション
    if (newPassword.length < 6) {
      const errorMsg = 'パスワードは6文字以上である必要があります';
      console.log('エラー:', errorMsg);
      setPasswordError(errorMsg);
      alert(errorMsg);
      return;
    }

    // 英文字、数字、記号（英数字以外の文字）の組み合わせをチェック
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword); // 英数字以外を記号として認識
    
    if (!hasLetter || !hasNumber || !hasSpecialChar) {
      const errorMsg = 'パスワードは英文字、数字、記号の組み合わせである必要があります';
      console.log('エラー:', errorMsg);
      console.log('  - 英文字:', hasLetter ? '✓' : '✗');
      console.log('  - 数字:', hasNumber ? '✓' : '✗');
      console.log('  - 記号:', hasSpecialChar ? '✓' : '✗');
      setPasswordError(errorMsg);
      alert(errorMsg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const errorMsg = 'パスワードが一致しません';
      console.log('エラー:', errorMsg);
      setPasswordError(errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      // セッション確認
      console.log('現在のユーザー情報:', user?.email);
      const { data: session } = await supabase.auth.getSession();
      console.log('セッション状態:', session ? 'あり' : 'なし');
      
      if (!session?.session) {
        throw new Error('ログインセッションが見つかりません。再度ログインしてください。');
      }

      console.log('Supabaseでパスワード更新を実行...');
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      console.log('Supabase応答 - data:', data);
      console.log('Supabase応答 - error:', error);
      console.log('Supabase応答 - error (full):', JSON.stringify(error, null, 2));

      if (error) {
        console.error('Supabaseエラー詳細:', {
          message: error.message,
          status: error.status,
          name: error.name,
          full_error: error
        });
        // エラーオブジェクト全体をthrowして、catch節で完全な情報を取得できるようにする
        throw { ...error, originalError: error };
      }

      console.log('✅ パスワード変更成功！');
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // アラートで成功を通知
      alert('✅ パスワードが正常に変更されました！');
      
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }, 2000);
    } catch (err: any) {
      console.error('❌ パスワード変更エラー:', err);
      console.error('❌ パスワード変更エラー（完全）:', JSON.stringify(err, null, 2));
      
      // errorオブジェクトからメッセージを取得（様々なパターンを試す）
      let errorMessage = '';
      if (err?.message) {
        errorMessage = String(err.message);
      } else if (err?.error?.message) {
        errorMessage = String(err.error.message);
      } else if (err?.originalError?.message) {
        errorMessage = String(err.originalError.message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.toString && err.toString() !== '[object Object]') {
        errorMessage = err.toString();
      }
      
      console.log('🔍 抽出したエラーメッセージ:', errorMessage);
      
      // Supabaseエラーを完全に日本語化（英語メッセージは絶対に表示しない）
      const msg = errorMessage.toLowerCase();
      let errorMsg = 'パスワード変更に失敗しました';
      
      // 同じパスワードのエラー（様々な表現を完全カバー）
      if (msg.includes('different') || 
          msg.includes('should be different') ||
          msg.includes('must be different') ||
          msg.includes('new password should be different') ||
          msg.includes('new password must be different') ||
          (msg.includes('same') && msg.includes('password'))) {
        errorMsg = '新しいパスワードは現在のパスワードと異なる必要があります';
      }
      // パスワードが弱すぎる
      else if (msg.includes('weak') || msg.includes('strength') || msg.includes('too simple')) {
        errorMsg = 'パスワードが弱すぎます。より強力なパスワードを使用してください';
      }
      // パスワード長エラー
      else if (msg.includes('length') || msg.includes('too short') || msg.includes('too long')) {
        errorMsg = 'パスワードの長さが不正です。6文字以上で設定してください';
      }
      // パスワード形式エラー
      else if (msg.includes('format') || msg.includes('invalid') || msg.includes('must contain')) {
        errorMsg = 'パスワードの形式が不正です。英文字、数字、記号を含めてください';
      }
      // セッションエラー
      else if (msg.includes('session') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('unauthenticated')) {
        errorMsg = 'セッションが無効です。再度ログインしてください';
      }
      // ユーザーが見つからない
      else if (msg.includes('user not found') || msg.includes('user does not exist')) {
        errorMsg = 'ユーザーが見つかりません。再度ログインしてください';
      }
      // ネットワークエラー
      else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
        errorMsg = 'ネットワークエラーが発生しました。接続を確認してください';
      }
      // レート制限
      else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        errorMsg = 'リクエストが多すぎます。しばらく待ってから再度お試しください';
      }
      // その他のエラー（必ず日本語メッセージを返す）
      // 何があっても英語メッセージは表示しない
      
      console.log('🔍 エラーメッセージ判定前:', { errorMsg, msg, errorMessage });
      
      // 最終チェック：英語が含まれている場合は必ず日本語に置き換え
      // エラーメッセージに英語が含まれている場合、完全に日本語化する
      let finalErrorMessage = errorMsg;
      
      // 英語文字が含まれているかチェック（絵文字や記号は除外）
      const hasEnglish = /[a-zA-Z]/.test(finalErrorMessage);
      
      if (hasEnglish && !finalErrorMessage.includes('✅') && !finalErrorMessage.includes('❌')) {
        // 英語が含まれている場合は、完全に日本語の汎用メッセージに置き換え
        finalErrorMessage = 'パスワード変更に失敗しました。入力内容を確認してください';
        console.log('⚠️ 英語が検出されたため、日本語メッセージに置き換えました');
      }
      
      // さらに厳密にチェック：英語のみのメッセージがないか確認
      if (finalErrorMessage.match(/^[a-zA-Z\s:.,!?-]+$/)) {
        finalErrorMessage = 'パスワード変更に失敗しました。入力内容を確認してください';
        console.log('⚠️ 英語のみのメッセージが検出されたため、日本語メッセージに置き換えました');
      }
      
      console.log('✅ 最終エラーメッセージ（日本語保証）:', finalErrorMessage);
      
      // 確実に日本語のみのメッセージを設定
      setPasswordError(finalErrorMessage);
      alert('❌ ' + finalErrorMessage);
    }
    
    console.log('=== パスワード変更処理終了 ===');
  };

  // 会員種別のラベル取得
  const getMembershipLabel = (type: 'free' | 'subscription' | 'lifetime') => {
    switch (type) {
      case 'free':
        return 'ブロンズ会員';
      case 'subscription':
        return 'シルバー会員';
      case 'lifetime':
        return 'ゴールド会員';
      default:
        return 'ブロンズ会員';
    }
  };

  // 会員種別のアイコン取得
  const getMembershipIcon = (type: 'free' | 'subscription' | 'lifetime') => {
    switch (type) {
      case 'free':
        return '🥉';
      case 'subscription':
        return '🥈';
      case 'lifetime':
        return '🏆';
      default:
        return '🥉';
    }
  };

  // 会員種別の色取得
  const getMembershipColor = (type: 'free' | 'subscription' | 'lifetime') => {
    switch (type) {
      case 'free':
        return {
          border: '#cd7f32',
          bg: '#fef3c7',
          gradient: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
        };
      case 'subscription':
        return {
          border: '#c0c0c0',
          bg: '#f3f4f6',
          gradient: 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)'
        };
      case 'lifetime':
        return {
          border: '#ffd700',
          bg: '#fef9c3',
          gradient: 'linear-gradient(135deg, #fef9c3 0%, #fbbf24 100%)'
        };
      default:
        return {
          border: '#cd7f32',
          bg: '#fef3c7',
          gradient: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
        };
    }
  };

  // 会員種別の切り替え処理
  const handleMembershipChange = async (newType: 'free' | 'subscription' | 'lifetime') => {
    console.log('🔄 handleMembershipChange called:', { 
      currentType: membershipType, 
      newType,
      isMobile 
    });
    
    // 現在の会員種別と同じ場合は何もしない
    if (membershipType === newType) {
      console.log('⚠️ 同じプランなのでスキップ');
      return;
    }

    // ダウングレードかどうかを判定
    const isDowngrading = (
      (membershipType === 'lifetime' && (newType === 'subscription' || newType === 'free')) ||
      (membershipType === 'subscription' && newType === 'free')
    );
    
    console.log('💰 プラン変更処理:', { isDowngrading, newType });
    
    // アカウントメニューを閉じる（モバイルの場合）
    if (showAccountMenu) {
      setShowAccountMenu(false);
    }
    
    // すべての変更で料金モーダルを表示
    setIsDowngrade(isDowngrading);
    setSelectedPlan(newType);
    setShowPricingModal(true);
    
    console.log('✅ プラン変更モーダルを表示');
  };

  // Stripe決済処理（アップグレード/ダウングレード）
  const handleStripeCheckout = async (plan: 'free' | 'subscription' | 'lifetime') => {
    // TODO: Stripe統合（アップグレード時のみ）
    // 現在はデモ用にSupabaseのuser_metadataを更新
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          membership_type: plan
        }
      });

      if (error) throw error;

      // ユーザー情報を再取得して最新の状態を反映
      const { data: { user: updatedUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error('ユーザー情報の再取得エラー:', getUserError);
      } else if (updatedUser) {
        // 最新のユーザー情報をセット（これによりuseEffectが再実行される）
        setUser(updatedUser);
        // ステートも直接更新（確実に反映させるため）
        setMembershipType(plan);
      } else {
        // フォールバック: ステートのみ更新
        setMembershipType(plan);
      }

      setShowPricingModal(false);
      setSelectedPlan(null);
      setIsDowngrade(false);
      
      const planName = plan === 'free' ? 'ブロンズ会員' : plan === 'subscription' ? 'シルバー会員' : 'ゴールド会員';
      alert(`${planName}に変更しました！`);
    } catch (err: any) {
      alert('エラーが発生しました: ' + err.message);
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
  const audioRef = useRef<HTMLAudioElement>(null); // 学習モード用
  const exampleAudioRef = useRef<HTMLAudioElement>(null); // 学習モード用
  const normalModeAudioRef = useRef<HTMLAudioElement>(null); // ノーマルモード用
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [examplePlaybackSpeed, setExamplePlaybackSpeed] = useState('1');
  const [showHelpCard, setShowHelpCard] = useState(false);
  const [dontShowHelpAgain, setDontShowHelpAgain] = useState(false);
  // 入力欄からの検索結果をノーマルモードでも表示するためのフラグ
  const [forceShowResult, setForceShowResult] = useState(false);
  // インポート状態（PDF/TXT/OCR）
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // iOS風アウトラインアイコン
  const FolderIcon = ({ size = 20, yOffset = 0 }: { size?: number; yOffset?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', transform: `translateY(${yOffset}px)` }}
    >
      <path
        d="M3.5 7.75C3.5 6.784 4.284 6 5.25 6H9l1.5 2h8.25c.966 0 1.75.784 1.75 1.75v7.5c0 .966-.784 1.75-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 17.25v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );

  const CameraIcon = ({ size = 20, yOffset = 0 }: { size?: number; yOffset?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', transform: `translateY(${yOffset}px)` }}
    >
      <path
        d="M8.5 7.5 10 6h4l1.5 1.5H19A2 2 0 0 1 21 9.5v7A2 2 0 0 1 19 18.5H5A2 2 0 0 1 3 16.5v-7A2 2 0 0 1 5 7.5h3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );

  // TXT読み込み
  const readTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const textRaw = String(reader.result || '');
          // 正規化（両端空白・連続空白の縮約）
          const normalized = textRaw
            .replace(/\r\n/g, '\n')
            .replace(/\u00A0/g, ' ')
            .replace(/[\t\v\f]+/g, ' ')
            .trim();
          resolve(normalized.length > 4000 ? normalized.slice(0, 4000) : normalized);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // PDFテキスト抽出（pdfjs-dist）- 中国語・広東語対応
  const extractTextFromPdf = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
    const pdfjsLib: any = await import('pdfjs-dist');
    // CDNのworkerを設定（バンドル不要）
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // 中国語・広東語のフォント埋め込みPDFに対応
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 10); // 上限
    let fullText = '';
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      // 中国語文字（簡体字・繁体字）を正しく抽出
      const strings = content.items.map((it: any) => {
        // フォント情報からエンコーディングを推測してテキストを取得
        let text = it.str || '';
        // エンコーディング変換を試みる
        try {
          // UTF-8として解釈
          if (text && typeof text === 'string') {
            // 不正な文字を除去
            text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
          }
        } catch (e) {
          console.warn('テキスト処理エラー:', e);
        }
        return text;
      });
      fullText += strings.join(' ') + '\n';
      if (onProgress) onProgress(Math.round((pageNum / maxPages) * 100));
    }
    // テキストの正規化とエンコーディング処理
    let normalized = fullText
      .replace(/\u00A0/g, ' ') // ノンブレーキングスペースを通常スペースに
      .replace(/[\t\v\f]+/g, ' ') // タブ等をスペースに
      .replace(/\s{3,}/g, ' ') // 連続する空白を1つに
      .trim();
    
    // UTF-8エンコーディングの確認と正規化
    try {
      const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(
        new TextEncoder().encode(normalized)
      );
      normalized = utf8Text || normalized;
    } catch (e) {
      console.warn('PDFエンコーディング変換エラー:', e);
    }
    
    return normalized.length > 4000 ? normalized.slice(0, 4000) : normalized;
  };

  // HEIC形式をJPEG/PNGに変換
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      
      // heic2anyは配列を返す可能性がある
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // BlobをFileオブジェクトに変換
      const convertedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      return convertedFile;
    } catch (error) {
      console.error('HEIC変換エラー:', error);
      throw new Error('HEIC形式の変換に失敗しました。');
    }
  };

  // 画像OCR（Tesseract.js）- 広東語・中国語・日本語対応
  const runOcr = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
    let imageFile = file;
    
    // HEIC形式の場合はJPEGに変換
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType === 'image/heic' || fileType === 'image/heif') {
      if (onProgress) {
        onProgress(10); // 変換開始
      }
      imageFile = await convertHeicToJpeg(file);
      if (onProgress) {
        onProgress(20); // 変換完了
      }
    }
    
    const Tesseract: any = await import('tesseract.js');
    const { createWorker } = Tesseract as any;
    
    // createWorkerの新しいAPI形式を使用
    // 繁体字中国語を優先、次に日本語、最後に簡体字
    // chi_tra: 繁体字中国語（広東語含む、優先）、jpn: 日本語、chi_sim: 簡体字中国語
    const worker = await createWorker('chi_tra+jpn+chi_sim', 1, {});
    
    try {
      // PSM（Page Segmentation Mode）を設定して精度を向上
      // PSM 6: 単一の統一されたテキストブロックとして認識（縦書き・横書き混在対応）
      // PSM 11: 可能な限り多くのテキストを検出
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // 単一テキストブロック
        tessedit_char_whitelist: '', // 文字制限なし（すべての文字を認識）
      });
      
      // Fileオブジェクトを直接渡す（arrayBufferではなく）
      // Tesseract.jsはFile、Blob、または画像URLを受け取る
      const result = await worker.recognize(imageFile);
      
      // 進捗を100%に設定
      if (onProgress) {
        onProgress(100);
      }
      
      await worker.terminate();
      
      // テキストの正規化とエンコーディング処理
      let text = String(result?.data?.text || '');
      
      // 改行をスペースに統一
      text = text.replace(/\r\n|\r|\n/g, ' ');
      
      // 句読点以外のスペースをすべて削除
      // 中国語・日本語文章では文字間のスペースは不要
      // 句読点（，。、．）の前後のスペースは保持（読みやすさのため）
      // ただし、句読点の前後に複数のスペースがある場合は1つに
      text = text
        // 句読点の前後にスペースを1つ追加（後で削除する前に統一）
        .replace(/([，。、．])\s*/g, '$1 ') // 句読点の後にスペースを追加
        .replace(/\s*([，。、．])/g, ' $1') // 句読点の前にスペースを追加
        // すべてのスペースを削除
        .replace(/\s+/g, '')
        // 句読点の前後にスペースを1つ追加（読みやすさのため）
        .replace(/([，。、．])/g, '$1 ')
        .trim();
      // エンコーディングの正規化（UTF-8に統一）
      try {
        // テキストが正しくUTF-8として解釈できるか確認
        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(
          new TextEncoder().encode(text)
        );
        text = utf8Text || text;
      } catch (e) {
        // エンコーディング変換に失敗した場合は元のテキストを使用
        console.warn('エンコーディング変換エラー:', e);
      }
      return text.length > 4000 ? text.slice(0, 4000) : text;
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  };
  
  // カテゴリーバーのスクロール状態
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    // ユーザー情報の取得
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('ユーザー取得エラー:', error);
      } else {
        setUser(user);
        // デバッグ: ユーザー情報を詳細にログ出力
        if (user) {
          console.log('=== 現在のユーザー情報（Supabase） ===');
          console.log('Email:', user.email);
          console.log('User ID:', user.id);
          console.log('Username (metadata):', user.user_metadata?.username);
          console.log('Membership Type (metadata):', user.user_metadata?.membership_type);
          console.log('Has Password:', user.identities?.some(i => i.provider === 'email'));
          console.log('Last Sign In:', user.last_sign_in_at);
          console.log('Updated At:', user.updated_at);
          console.log('Full Metadata:', JSON.stringify(user.user_metadata, null, 2));
          console.log('====================================');
        }
      }
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

  // デフォルトカテゴリー保存処理
  const handleDefaultCategoryChange = async (newCategoryId: string) => {
    if (!user) return;
    
    setIsSavingDefaultCategory(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          default_category_id: newCategoryId
        }
      });

      if (error) {
        console.error('デフォルトカテゴリー保存エラー:', error);
        alert('デフォルトカテゴリーの保存に失敗しました。');
        return;
      }

      // 状態を更新
      console.log('✅ デフォルトカテゴリーを保存:', newCategoryId);
      setDefaultCategoryId(newCategoryId);
      setShowCategoryPicker(false);
      
      // 現在選択中のカテゴリーがデフォルトカテゴリーでない場合、デフォルトカテゴリーに切り替え
      const regularCategories = categoriesData as Category[];
      const newDefaultCategory = regularCategories.find(c => c.id === newCategoryId);
      if (newDefaultCategory && selectedCategory !== newCategoryId) {
        console.log('🔄 カテゴリーをデフォルトカテゴリーに切り替え:', newCategoryId);
        setSelectedCategory(newCategoryId);
        setCurrentCategory(newDefaultCategory);
        setCurrentWords(newDefaultCategory.words || []);
      }
      
      // ユーザー情報を再取得して最新の状態を反映
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ ユーザー情報を再取得完了');
      }
      
      alert('デフォルトカテゴリーを保存しました。次回のログイン時から適用されます。');
    } catch (err) {
      console.error('デフォルトカテゴリー保存失敗:', err);
      alert('デフォルトカテゴリーの保存に失敗しました。');
    } finally {
      setIsSavingDefaultCategory(false);
    }
  };

  useEffect(() => {
    // カテゴリデータを読み込む（通常のカテゴリーのみ、Noteカテゴリーは除外）
    const regularCategories = categoriesData as Category[];
    setCategories(regularCategories);
  }, []);

  // ユーザー情報とデフォルトカテゴリーが読み込まれた後にカテゴリーを適用（初回ロード時のみ）
  const hasAppliedDefaultCategory = useRef(false);
  useEffect(() => {
    // カテゴリーが読み込まれていない場合は待機
    if (categories.length === 0) {
      console.log('⏳ カテゴリー適用待機中:', { categoriesCount: categories.length });
      return;
    }
    
    // 既にデフォルトカテゴリーを適用済みの場合はスキップ（ユーザーが手動でカテゴリーを選択した場合）
    if (hasAppliedDefaultCategory.current) {
      console.log('✅ デフォルトカテゴリーは既に適用済み、スキップ');
      return;
    }
    
    // 既にカテゴリーが選択されている場合はスキップ
    if (selectedCategory) {
      console.log('✅ カテゴリーは既に選択済み:', selectedCategory);
      hasAppliedDefaultCategory.current = true;
      return;
    }
    
    // デフォルトカテゴリーを適用（ユーザー設定がある場合はそれを使用、なければpronunciation）
    const regularCategories = categories.filter(c => !c.id.startsWith('note_'));
    if (regularCategories.length > 0) {
      // ユーザーがログインしている場合はdefaultCategoryIdを使用、そうでなければpronunciationを使用
      const targetCategoryId = user ? defaultCategoryId : 'pronunciation';
      const defaultCategory = regularCategories.find(c => c.id === targetCategoryId) || regularCategories.find(c => c.id === 'pronunciation') || regularCategories[0];
      console.log('🎯 デフォルトカテゴリーを適用:', { 
        defaultCategoryId: targetCategoryId, 
        categoryName: defaultCategory.name,
        categoryId: defaultCategory.id,
        hasUser: !!user
      });
      setSelectedCategory(defaultCategory.id);
      setCurrentCategory(defaultCategory);
      setCurrentWords(defaultCategory.words || []);
      hasAppliedDefaultCategory.current = true;
    }
  }, [user, defaultCategoryId, categories, selectedCategory]);
  
  // Noteサブカテゴリーバーのスクロール状態を初期化
  useEffect(() => {
    if (showNoteSubCategories && noteSubCategoryScrollRef.current) {
      const checkScroll = () => {
        if (noteSubCategoryScrollRef.current) {
          const { scrollWidth, clientWidth } = noteSubCategoryScrollRef.current;
          setShowNoteSubRightArrow(scrollWidth > clientWidth);
          setShowNoteSubLeftArrow(false);
        }
      };
      // 少し遅延して実行（レンダリング後に）
      setTimeout(checkScroll, 100);
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [showNoteSubCategories]);

  // お気に入り画面での単語と元のcategoryIdのマッピングを保持
  const favoriteWordCategoryMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (selectedCategory === 'favorites') {
      // お気に入りカテゴリーの場合
      if (favorites.size === 0) {
        setCurrentWords([]);
        setCurrentCategory(null);
        favoriteWordCategoryMapRef.current.clear();
      } else {
        // お気に入り単語を取得
        const favoriteWords: Word[] = [];
        const categoryMap = new Map<string, string>(); // word.chinese -> categoryId
        favorites.forEach((favoriteKey) => {
          const [categoryId, wordChinese] = favoriteKey.split(':');
          
          // まず通常のカテゴリーから検索
          let category = categories.find(c => c.id === categoryId);
          let word: Word | undefined;
          
          if (category) {
            // 通常カテゴリーから単語を検索
            if (category.words) {
              word = category.words.find(w => w.chinese === wordChinese);
            }
            // practiceGroupsからも検索
            if (!word && category.practiceGroups) {
              category.practiceGroups.forEach(group => {
                const foundWord = group.words.find(w => w.chinese === wordChinese);
                if (foundWord) {
                  word = foundWord;
                }
              });
            }
          } else {
            // 通常カテゴリーに見つからない場合、Noteカテゴリーから検索
            const noteCategory = (noteCategoriesData as Category[]).find(c => c.id === categoryId);
            if (noteCategory && noteCategory.words) {
              word = noteCategory.words.find(w => w.chinese === wordChinese);
              category = noteCategory; // Noteカテゴリーを設定
            }
          }
          
          // 単語が見つかった場合は追加
          if (word && !favoriteWords.find(w => w.chinese === wordChinese)) {
            favoriteWords.push({ ...word, chinese: word.chinese });
            categoryMap.set(word.chinese, categoryId); // 元のcategoryIdを保存
          }
        });
        favoriteWordCategoryMapRef.current = categoryMap; // マップを保存
        setCurrentWords(favoriteWords);
        setCurrentCategory({ id: 'favorites', name: 'お気に入り', words: favoriteWords });
      }
      // カテゴリーを切り替えた時に検索結果とアクティブな単語をクリア
      setResult(null);
      setError(null);
      setSearchQuery('');
      setActiveWordId(null);
    } else if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        setCurrentCategory(category);
        setCurrentWords(category.words || []);
        // カテゴリーを切り替えた時に検索結果とアクティブな単語をクリア
        setResult(null);
        setError(null);
        setSearchQuery('');
        setActiveWordId(null);
      }
    } else if (selectedNoteCategory) {
      // Noteサブカテゴリーが選択された場合
      const noteCategory = (noteCategoriesData as Category[]).find(c => c.id === selectedNoteCategory);
      if (noteCategory) {
        setCurrentCategory(noteCategory);
        setCurrentWords(noteCategory.words || []);
        // カテゴリーを切り替えた時に検索結果とアクティブな単語をクリア
        setResult(null);
        setError(null);
        setSearchQuery('');
        setActiveWordId(null);
      }
    }
  }, [selectedCategory, selectedNoteCategory, categories, favorites]);

  // カテゴリーバーのスクロール状態を更新
  const handleCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // カテゴリーバーのスクロール状態を初期化
  useEffect(() => {
    const checkScroll = () => {
      if (categoryScrollRef.current) {
        const { scrollWidth, clientWidth } = categoryScrollRef.current;
        setShowRightArrow(scrollWidth > clientWidth);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  // 初期スクロール位置を設定（「発音表記について」ボタンが左端に来るように）
  useEffect(() => {
    if (categoryScrollRef.current) {
      // 常に左端（スクロール位置0）からスタート
      categoryScrollRef.current.scrollLeft = 0;
      
      // スクロール後に矢印の状態を更新
      handleCategoryScroll();
    }
  }, [categories]);

  // 設定画面が開かれたときにデバッグ情報を自動取得
  useEffect(() => {
    if (showSettings && user) {
      const fetchDebugInfo = async () => {
        setLoadingDebugInfo(true);
        try {
          const response = await fetch('/api/debug-user');
          const data = await response.json();
          if (data.success) {
            setDebugInfo(data.user);
            console.log('✅ Supabaseデータ確認完了:', data.user);
          } else {
            console.error('デバッグ情報取得エラー:', data.error);
          }
        } catch (error: any) {
          console.error('デバッグ情報取得エラー:', error.message);
        } finally {
          setLoadingDebugInfo(false);
        }
      };
      fetchDebugInfo();
    }
  }, [showSettings, user]);

  // 設定メニューの外側クリックで閉じる処理
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 設定パネル内の要素をクリックした場合は何もしない
      const settingsPanel = document.querySelector('[data-settings-panel]');
      if (settingsPanel && settingsPanel.contains(target)) {
        return;
      }
      
      // アカウントメニューやその他の要素をクリックした場合も何もしない
      // （それらの要素自体がクリックを処理するため）
      if (target.closest('[data-settings-panel]')) {
        return;
      }
      
      // それ以外のクリックで設定を閉じる
      setShowSettings(false);
      setShowPasswordChange(false);
      setPasswordError(null);
      setPasswordSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
    };

    // イベントリスナーを追加（少し遅延させて、設定メニューを開くクリックイベントが処理される前に閉じないようにする）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showSettings]);

  // アカウントメニューの外側クリックで閉じる処理
  useEffect(() => {
    if (!showAccountMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // アカウントメニュー内の要素をクリックした場合は何もしない
      const accountMenu = document.querySelector('[data-account-menu]');
      if (accountMenu && accountMenu.contains(target)) {
        return;
      }
      
      // アカウントメニューを開くボタンをクリックした場合は何もしない（トグル動作）
      if (target.closest('[data-account-menu-button]')) {
        return;
      }
      
      // それ以外のクリックでアカウントメニューを閉じる
      setShowAccountMenu(false);
    };

    // イベントリスナーを追加（少し遅延させて、メニューを開くクリックイベントが処理される前に閉じないようにする）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showAccountMenu]);

  // プランカードモーダルのスクロール状態を初期化と背景スクロールの無効化
  useEffect(() => {
    if (showPricingModal && selectedPlan) {
      // 背景のスクロールを無効化
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      const checkScroll = () => {
        if (pricingModalScrollRef.current) {
          // 強制的に再計算を促すため、少し遅延
          requestAnimationFrame(() => {
            if (pricingModalScrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = pricingModalScrollRef.current;
              const canScroll = scrollHeight > clientHeight;
              const isAtTop = scrollTop <= 10;
              const isAtBottom = scrollTop >= scrollHeight - clientHeight - 10;
              
              // スクロール可能な場合のみ矢印を表示
              if (canScroll) {
                setShowPricingModalTopArrow(!isAtTop);
                setShowPricingModalBottomArrow(!isAtBottom);
              } else {
                setShowPricingModalTopArrow(false);
                setShowPricingModalBottomArrow(false);
              }
            }
          });
        }
      };
      
      // 初回チェック（レンダリング後）
      setTimeout(checkScroll, 150);
      // リサイズ時にもチェック
      window.addEventListener('resize', checkScroll);
      // スクロール時にもチェック
      if (pricingModalScrollRef.current) {
        pricingModalScrollRef.current.addEventListener('scroll', checkScroll);
      }
      
      return () => {
        window.removeEventListener('resize', checkScroll);
        if (pricingModalScrollRef.current) {
          pricingModalScrollRef.current.removeEventListener('scroll', checkScroll);
        }
        document.body.style.overflow = originalStyle;
      };
    } else {
      // モーダルが閉じられたら背景スクロールを復元
      document.body.style.overflow = '';
      setShowPricingModalTopArrow(false);
      setShowPricingModalBottomArrow(false);
    }
  }, [showPricingModal, selectedPlan]);

  const handleSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    console.log('🔍 handleSearch開始:', { query, queryLength: query.length });

    // 入力欄からの検索は、学習モードでなくても結果パネルを表示する
    setForceShowResult(true);

    setLoading(true);
    setError(null);

    try {
      console.log('📡 API呼び出し開始: /api/process-phrase');
      const response = await fetch('/api/process-phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phrase: query }),
      });

      console.log('📡 APIレスポンス:', { ok: response.ok, status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ APIエラー:', { status: response.status, errorText });
        throw new Error(`検索に失敗しました: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ APIデータ受信:', { 
        hasJyutping: !!data.jyutping, 
        hasKatakana: !!data.katakana,
        hasExample: !!data.exampleCantonese,
        translatedText: data.translatedText,
        originalText: data.originalText,
        data 
      });
      
      // 翻訳されたテキストがある場合はそれを使用、なければ元のクエリを使用
      const textForAudio = data.translatedText || query;
      
      // 単語音声を生成（翻訳された広東語テキストを使用）
      const audioResponse = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textForAudio }),
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
      
      // 長文（50文字超）の場合は粤ピン・カタカナをデフォルトで非表示
      const textLength = (resultData.translatedText || query).length;
      if (textLength > 50) {
        setShowPronunciationDetails(false);
      } else {
        setShowPronunciationDetails(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (word: Word) => {
    playHapticAndSound(); // 振動と音を再生
    // すべてのモードで押下ログを送信
    // categoryIdの取得: noteカテゴリーが選択されている場合はselectedNoteCategoryを優先
    const categoryId = selectedNoteCategory || currentCategory?.id || '';
    try { 
      const response = await fetch('/api/track-button', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ wordChinese: word.chinese, categoryId }) 
      });
      if (!response.ok) {
        console.error('ボタン押下トラッキングエラー:', response.status);
      }
    } catch (err) {
      console.error('ボタン押下トラッキング失敗:', err);
    }
    
    // 学習モードの場合はページトップにスクロール
    if (isLearningMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    if (isLearningMode) {
      // 学習モード：例文も表示、音声プレイヤーを表示
      setForceShowResult(true); // 結果パネルを表示する
      setSearchQuery(word.chinese);
      
      // 学習モードでは常に例文生成と音声生成を実行
      setLoading(true);
      try {
        // jyutpingとkatakanaが既に存在する場合
        if (word.jyutping && word.katakana) {
          // 例文生成と音声生成を実行
          const exampleResponse = await fetch('/api/process-phrase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phrase: word.chinese }),
          });

          let exampleData: any = {
            exampleCantonese: '',
            exampleJapanese: '',
            exampleFull: '',
          };

          if (exampleResponse.ok) {
            exampleData = await exampleResponse.json();
          }

          // 単語音声を生成
          const audioResponse = await fetch('/api/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: word.chinese }),
          });

          let resultData: SearchResult = {
            jyutping: word.jyutping || '',
            katakana: word.katakana || '',
            jyutpingMulti: '',
            katakanaMulti: '',
            exampleCantonese: exampleData.exampleCantonese || '',
            exampleJapanese: exampleData.exampleJapanese || '',
            exampleFull: exampleData.exampleFull || '',
            audioBase64: undefined,
            exampleAudioBase64: undefined,
          };

          if (audioResponse.ok) {
            const audioData = await audioResponse.json();
            resultData.audioBase64 = audioData.audioContent;
          }

          // 例文音声を生成（例文が存在する場合）
          if (resultData.exampleCantonese && resultData.exampleCantonese !== '例文生成エラーが発生しました' && resultData.exampleCantonese.trim() !== '') {
            const exampleAudioResponse = await fetch('/api/generate-speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: resultData.exampleCantonese }),
            });

            if (exampleAudioResponse.ok) {
              const exampleAudioData = await exampleAudioResponse.json();
              resultData.exampleAudioBase64 = exampleAudioData.audioContent;
            }
          }

          setResult(resultData);
          
          // 長文（50文字超）の場合は粤ピン・カタカナをデフォルトで非表示
          const textLength = word.chinese.length;
          if (textLength > 50) {
            setShowPronunciationDetails(false);
          } else {
            setShowPronunciationDetails(true);
          }
        } else {
          // jyutpingとkatakanaが存在しない場合は通常のAPI呼び出し
          await handleSearch(word.chinese);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setResult(null);
      } finally {
        setLoading(false);
      }
    } else {
      // ノーマルモード：単語のみの音声を再生、ボタンを緑色にする（1つだけ）
      // 入力欄からの結果パネルは非表示にする
      setForceShowResult(false);
      const wordId = word.chinese;
      
      // 前のボタンの緑を消して、新しいボタンだけを緑にする
      setActiveWordId(wordId);
      
      // 単語の音声のみを生成して再生
      try {
        console.log('ノーマルモード: API呼び出し開始', { text: word.chinese });
        
        const audioResponse = await fetch('/api/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: word.chinese }),
        });
        
        console.log('ノーマルモード: APIレスポンス受信', { 
          ok: audioResponse.ok, 
          status: audioResponse.status 
        });
        
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          const audioBase64 = audioData.audioContent;
          console.log('ノーマルモード: 音声データ取得', { 
            hasAudioContent: !!audioBase64,
            audioLength: audioBase64?.length 
          });
          
          // 音声を自動再生（ノーマルモード専用audio要素を使用）
          if (normalModeAudioRef.current && audioBase64) {
            console.log('ノーマルモード: 音声再生開始', { wordId, audioBase64Length: audioBase64.length });
            
            // 既存の音声を停止
            normalModeAudioRef.current.pause();
            normalModeAudioRef.current.currentTime = 0;
            
            // 新しい音声をセット
            normalModeAudioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
            normalModeAudioRef.current.playbackRate = 1.0; // ノーマルモードでは速度固定
            
            // 再生を試みる
            const playPromise = normalModeAudioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('ノーマルモード: 音声再生成功');
                })
                .catch(e => {
                  console.error('ノーマルモード: 音声再生失敗', e);
                });
            }
          } else {
            console.error('ノーマルモード: audio要素またはaudioBase64が存在しない', {
              hasAudioRef: !!normalModeAudioRef.current,
              hasAudioBase64: !!audioBase64
            });
          }
        } else {
          console.error('ノーマルモード: API呼び出し失敗', { 
            status: audioResponse.status,
            statusText: audioResponse.statusText
          });
        }
      } catch (err) {
        console.error('ノーマルモード: エラー発生', err);
      }
    }
  };

  const handleTranslateAndConvert = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    // グリーンボタンも共通の処理を使用（サーバー側で判定/処理）
    await handleSearch(query);
  };

  // 音声ボタンのクリックハンドラー
  const handleToneAudioClick = async (e: Event) => {
    const button = e.target as HTMLButtonElement;
    const text = button.getAttribute('data-text');
    if (!text) return;

    // ハプティックフィードバック
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // クリック音
    if (isClickSoundEnabled && audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    }

    // ノーマルモードの場合、緑色に変える
    if (!isLearningMode) {
      setActiveWordId(text);
    }

    // ボタン押下をトラッキング（pronunciationカテゴリー）
    try {
      await fetch('/api/track-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordChinese: text, categoryId: 'pronunciation' })
      });
    } catch (err) {
      console.error('Failed to track tone audio click:', err);
    }

    // 音声再生
    try {
      const audioResponse = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        const audioBase64 = audioData.audioContent;

        if (normalModeAudioRef.current && audioBase64) {
          normalModeAudioRef.current.pause();
          normalModeAudioRef.current.currentTime = 0;
          normalModeAudioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
          
          // 音声再生開始
          normalModeAudioRef.current.play();
          
          // 音声再生終了時にactiveWordIdをクリアして緑点灯を消す
          normalModeAudioRef.current.addEventListener('ended', () => {
            if (!isLearningMode) {
              setActiveWordId(null);
            }
          }, { once: true });
        }
      }
    } catch (err) {
      console.error('音声再生エラー:', err);
      // エラー時もactiveWordIdをクリア
      if (!isLearningMode) {
        setActiveWordId(null);
      }
    }
    // categoryIdの取得: noteカテゴリーが選択されている場合はselectedNoteCategoryを優先
    const categoryId = selectedNoteCategory || currentCategory?.id || 'pronunciation';
    try { 
      const response = await fetch('/api/track-button', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ wordChinese: text, categoryId }) 
      });
      if (!response.ok) {
        console.error('ボタン押下トラッキングエラー:', response.status);
      }
    } catch (err) {
      console.error('ボタン押下トラッキング失敗:', err);
    }
  };

  // 連続発音ボタンのクリックハンドラー
  const handleToneSequenceClick = async (e: Event) => {
    // e.targetがボタンでない場合（spanなどの子要素の場合）を考慮
    const target = e.target as HTMLElement;
    const button = target.closest('.tone-sequence-btn') as HTMLButtonElement;
    if (!button) {
      console.error('連続発音ボタンが見つかりません', target);
      return;
    }
    
    const sequence = button.getAttribute('data-sequence');
    if (!sequence) {
      console.error('連続発音ボタンにdata-sequence属性がありません', button);
      return;
    }
    
    console.log('✅ 連続発音ボタンクリック:', sequence, 'button:', button);

    // ハプティックフィードバック
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // クリック音
    if (isClickSoundEnabled && audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    }

    // 連続発音ボタンを緑色に点灯
    if (button) {
      button.style.background = 'linear-gradient(145deg, #10b981, #059669)';
      button.style.color = 'white';
    }
    
    // 個別ボタンの緑点灯を消す
    if (!isLearningMode) {
      setActiveWordId(null);
    }
    
    // テキスト全体を一度に送信（例: "3,9,4,0,5,2" または "7,8,6"）
    // カンマを読点に変換して自然な読み上げにする
    const textToSpeak = sequence.split(',').map(t => t.trim()).join('、');
    console.log('連続発音テキスト:', textToSpeak);
    
    try {
      const audioResponse = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!audioResponse.ok) {
        console.error('音声生成エラー:', audioResponse.status, await audioResponse.text());
        // エラー時はボタンの色をリセット
        if (button) {
          button.style.background = '#ffffff';
          button.style.color = '#111827';
        }
        return;
      }

      const audioData = await audioResponse.json();
      const audioBase64 = audioData.audioContent;

      if (!audioBase64) {
        console.error('音声データが空です');
        if (button) {
          button.style.background = '#ffffff';
          button.style.color = '#111827';
        }
        return;
      }

      if (normalModeAudioRef.current) {
        // 前の音声を停止
        normalModeAudioRef.current.pause();
        normalModeAudioRef.current.currentTime = 0;
        
        // 新しい音声を設定
        normalModeAudioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
        
        // 音声をロードして再生
        await new Promise<void>((resolve, reject) => {
          if (!normalModeAudioRef.current) {
            reject(new Error('audioRef is null'));
            return;
          }
          
          const audio = normalModeAudioRef.current;
          
          // ロード完了を待つ
          const handleCanPlay = () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('error', handleError);
            
            // 再生開始
            audio.play().then(() => {
              console.log('連続発音再生開始:', textToSpeak);
              resolve();
            }).catch((playErr) => {
              console.error('音声再生エラー:', playErr);
              reject(playErr);
            });
          };
          
          const handleError = () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('error', handleError);
            reject(new Error('音声のロードに失敗しました'));
          };
          
          audio.addEventListener('canplaythrough', handleCanPlay);
          audio.addEventListener('error', handleError);
          
          // 既にロード済みの場合
          if (audio.readyState >= 3) {
            handleCanPlay();
          }
        });
        
        // 再生完了後、連続発音ボタンの色をリセット
        if (normalModeAudioRef.current) {
          normalModeAudioRef.current.addEventListener('ended', () => {
            // 連続発音ボタンの色をリセット
            if (button) {
              button.style.background = '#ffffff';
              button.style.color = '#111827';
            }
            console.log('連続発音完了');
          }, { once: true });
        }
      } else {
        console.error('normalModeAudioRef.currentがnullです');
        if (button) {
          button.style.background = '#ffffff';
          button.style.color = '#111827';
        }
      }
    } catch (err) {
      console.error('音声再生エラー:', err);
      // エラー時はボタンの色をリセット
      if (button) {
        button.style.background = '#ffffff';
        button.style.color = '#111827';
      }
    }
  };

  // 音声ボタンのスタイル更新（activeWordIdが変わった時）
  useEffect(() => {
    if (currentCategory?.id === 'pronunciation') {
      // introContent内のボタンを探す（すべての.tone-audio-btn）
      const toneButtons = document.querySelectorAll('.tone-audio-btn');
      toneButtons.forEach((btn) => {
        const text = btn.getAttribute('data-text');
        if (!text) return;
        
        const isActive = !isLearningMode && activeWordId === text;
        if (isActive) {
          (btn as HTMLElement).style.background = 'linear-gradient(145deg, #10b981, #059669)';
          (btn as HTMLElement).style.color = 'white';
        } else {
          (btn as HTMLElement).style.background = '#ffffff';
          (btn as HTMLElement).style.color = '#111827';
        }
      });
      
      // 連続発音ボタンのスタイル更新は削除（handleToneSequenceClick内で直接制御）
    }
  }, [activeWordId, isLearningMode, currentCategory]);

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
        padding: isHiddenMode ? 0 : (isMobile ? '1rem' : '3rem'), 
        backgroundColor: isHiddenMode ? '#ffffff' : '#f3f4f6', 
        minHeight: '100vh',
        position: 'relative',
        transition: 'background-color 0.5s ease-out',
        overflow: isHiddenMode ? 'hidden' : 'visible'
      }}
    >
      {/* 隠しモードUI */}
      {isHiddenMode && (
        <>
          {/* 広東語翻訳エリア（上部、左に180度回転、浮き上がるアニメーション、新しいテキストが上に表示） */}
          <div style={{
            position: 'fixed',
            top: isMobile ? '2rem' : '4rem',
            left: '50%',
            transform: 'translateX(-50%) rotate(180deg)',
            width: '90%',
            maxWidth: '800px',
            maxHeight: isMobile ? '250px' : '300px',
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            animation: 'fadeInUp 0.6s ease-out',
            opacity: 1,
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: '100%'
            }}>
              {translatedTextLines.length > 0 ? (
                translatedTextLines.map((line, index) => (
                  <div 
                    key={`translated-${index}-${line.substring(0, 10)}`}
                    style={{ 
                      color: '#111827',
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      lineHeight: '1.8',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      borderLeft: index === 0 ? '3px solid rgba(59, 130, 246, 0.3)' : '3px solid rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {line}
                  </div>
                ))
              ) : translatedText ? (
                <div style={{ color: '#111827' }}>
                  {translatedText}
                </div>
              ) : (
                <div style={{ color: '#111827' }}>
                  広東語翻訳がここに表示されます...
                </div>
              )}
            </div>
          </div>

          {/* 日本語音声認識エリア（中央、浮き上がるアニメーション、新しいテキストが上に表示） */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '800px',
            maxHeight: isMobile ? '300px' : '400px',
            padding: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: isMobile ? '1.5rem' : '2rem',
            lineHeight: '1.8',
            wordBreak: 'break-word',
            animation: 'fadeInUp 0.8s ease-out',
            opacity: 1,
            zIndex: 1000,
            color: '#111827',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%',
              paddingBottom: '1rem'
            }}>
              {recognizedTextLines.length > 0 ? (
                <>
                  {recognizedTextLines.map((line, index) => (
                    <div 
                      key={`line-${index}-${line.substring(0, 10)}`}
                      style={{ 
                        color: '#111827',
                        fontSize: isMobile ? '1.5rem' : '2rem',
                        lineHeight: '1.8',
                        wordBreak: 'break-word',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.5rem',
                        backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        borderLeft: index === 0 ? '3px solid rgba(59, 130, 246, 0.3)' : '3px solid rgba(0, 0, 0, 0.1)',
                        textAlign: 'left'
                      }}
                    >
                      {line}
                    </div>
                  ))}
                  {interimText && (
                    <div style={{ 
                      color: '#6b7280', 
                      fontStyle: 'italic',
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(107, 114, 128, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid rgba(107, 114, 128, 0.2)',
                      textAlign: 'left'
                    }}>
                      {interimText}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {recognizedText || 'マイクボタンを押して日本語を話してください...'}
                  {interimText && (
                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      {interimText}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 終了ボタン（右上、浮き上がるアニメーション） */}
          <button
            onClick={exitHiddenMode}
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              color: '#111827',
              cursor: 'pointer',
              fontSize: '0.875rem',
              animation: 'fadeInUp 0.4s ease-out',
              opacity: 1,
              zIndex: 1001,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            ESCで終了
          </button>

          {/* タイトル表示（ロゴマークの下、タイル回転アニメーション） */}
          {showTitle && (
            <div style={{
              position: 'fixed',
              bottom: isMobile ? '3rem' : '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              animation: 'tileFlip 0.6s ease-out',
              zIndex: 1003
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '0.5rem',
                textShadow: 'none'
              }}>
                カントン語通訳
              </div>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: 700,
                color: '#6b7280',
                textShadow: 'none'
              }}>
                ボタンを押すだけでスパッと通訳！
              </div>
            </div>
          )}

          {/* タイトル音声（非表示） */}
          <audio
            ref={titleAudioRef}
            src="/interpreter-start.mp3"
            preload="auto"
            style={{ display: 'none' }}
          />

          {/* ロゴマーク（隠しモード時、下部に表示、マイクボタンとして機能） */}
          <div
            style={{
              position: 'fixed',
              bottom: isMobile ? 'calc(3rem + 120px)' : 'calc(5rem + 140px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile ? '96px' : '120px',
              height: isMobile ? '96px' : '120px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              boxShadow: isRecording 
                ? '0 0 20px rgba(239, 68, 68, 0.5)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.5s ease-out',
              zIndex: 1002,
              pointerEvents: 'auto',
              animation: 'fadeInUp 1s ease-out',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ロゴ長押し開始 - 音声認識開始');
              handleMicPress();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ロゴ離す - 音声認識停止');
              handleMicRelease();
            }}
            onMouseLeave={(e) => {
              // マウスがボタンの外に出た場合も停止
              if (isRecording) {
                e.preventDefault();
                e.stopPropagation();
                console.log('ロゴからマウス離脱 - 音声認識停止');
                handleMicRelease();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            onDragStart={(e) => {
              e.preventDefault();
              return false;
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ロゴ長押し開始（タッチ） - 音声認識開始');
              handleMicPress();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ロゴ離す（タッチ） - 音声認識停止');
              handleMicRelease();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ロゴタッチキャンセル - 音声認識停止');
              handleMicRelease();
            }}
          >
            <img
              ref={volumeLogoRef}
              src="/volume-logo.png?v=1"
              alt="microphone"
              draggable="false"
              style={{
                width: isMobile ? '96px' : '120px',
                height: isMobile ? '96px' : '120px',
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onDragStart={(e) => {
                e.preventDefault();
                return false;
              }}
            />
          </div>
        </>
      )}

      {/* 通常モードコンテンツ */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        opacity: isHiddenMode ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isHiddenMode ? 'none' : 'auto'
      }}>

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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '90vw' : '960px',
              maxWidth: '95vw',
              maxHeight: '70vh',
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
                スラング先生考案!カントン語音れん☝️(全{totalButtons}単語)収録！
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
                  ジャンル分け(トータル73ジャンル収録)は横スクロールできるカテゴリーバーから選択してください
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
          {/* ヘッダー（中央寄せ・3行構成） */}
          <div style={{ 
            marginBottom: isMobile ? '1rem' : '2rem',
            padding: isMobile ? '0 1rem' : '0 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* 三列: ロゴ / タイトル / サブ見出し */}
            <div style={{ 
              marginBottom: '0.25rem',
              transition: 'transform 0.5s ease-out',
              transform: isHiddenMode ? `translateY(calc(100vh - ${isMobile ? '3rem' : '5rem'} - ${isMobile ? '48px' : '56px'} - 0.25rem))` : 'translateY(0)'
            }}>
              <img 
                ref={volumeLogoRef}
                src="/volume-logo.png?v=1" 
                alt="logo" 
                draggable="false"
                style={{ 
                  width: isMobile ? 48 : 56, 
                  height: isMobile ? 48 : 56,
                  cursor: 'pointer',
                  transition: 'transform 0.5s ease-out',
                  transform: isHiddenMode ? 'scale(1.5)' : 'scale(1)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onDragStart={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onClick={() => {
                  // 音が再生中は無視
                  if (isPlayingSoundRef.current) {
                    return;
                  }
                  
                  clickCountRef.current += 1;
                  
                  // クリックタイマーをリセット
                  if (clickTimerRef.current) {
                    clearTimeout(clickTimerRef.current);
                  }
                  
                  // 3回目のクリックの時だけ音を再生
                  if (clickCountRef.current === 3) {
                    // 音を再生中フラグを立てる
                    isPlayingSoundRef.current = true;
                    
                    // クリック音を再生
                    if (audioContextRef.current && audioBufferRef.current) {
                      const source = audioContextRef.current.createBufferSource();
                      source.buffer = audioBufferRef.current;
                      source.connect(audioContextRef.current.destination);
                      
                      // 音声の長さを取得（秒）
                      const duration = audioBufferRef.current.duration;
                      
                      // 音声再生完了後に隠しモードを起動
                      source.onended = () => {
                        isPlayingSoundRef.current = false;
                        setIsHiddenMode(true);
                        clickCountRef.current = 0;
                        if (clickTimerRef.current) {
                          clearTimeout(clickTimerRef.current);
                        }
                      };
                      
                      source.start(0);
                    } else {
                      // 音声ファイルが読み込まれていない場合は即座に起動
                      isPlayingSoundRef.current = false;
                      setIsHiddenMode(true);
                      clickCountRef.current = 0;
                    }
                  } else if (clickCountRef.current > 3) {
                    // 4回目以降は無視（音が再生中）
                    return;
                  } else {
                    // 1回目、2回目: 1秒以内にクリックがなければリセット
                    clickTimerRef.current = setTimeout(() => {
                      clickCountRef.current = 0;
                    }, 1000);
                  }
                }}
              />
            </div>
            <div style={{ 
              fontSize: isMobile ? '1.625rem' : '2.25rem', 
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#111827'
            }}>
              カントン語音れん！
            </div>
            <div style={{
              marginTop: '0.35rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#6b7280',
              fontWeight: 600
            }}>
              ボタンを押すだけでスパッと発音！
            </div>
            {/* 参照行は不要のため削除 */}
          </div>

          {/* ラベル: カテゴリー選択 */}
          <div style={{
            padding: isMobile ? '0 1rem' : '0 1.5rem',
            marginBottom: '0.25rem',
            color: '#6b7280',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 600
          }}>カテゴリー選択</div>

          {/* 横スクロール可能なカテゴリーバー */}
          <div style={{ 
            marginBottom: '1rem',
            position: 'relative',
            padding: isMobile ? '0 1rem' : '0 1.5rem',
            zIndex: 10
          }}>
            {/* 左スクロールインジケーター */}
            {showLeftArrow && (
              <div style={{
                position: 'absolute',
                left: isMobile ? '1rem' : '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                fontSize: isMobile ? '1.5rem' : '2rem',
                opacity: 0.5,
                pointerEvents: 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                ⏪
              </div>
            )}
            
            {/* 右スクロールインジケーター */}
            {showRightArrow && (
              <div style={{
                position: 'absolute',
                right: isMobile ? '1rem' : '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                fontSize: isMobile ? '1.5rem' : '2rem',
                opacity: 0.5,
                pointerEvents: 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                ⏩
              </div>
            )}
            
            <div 
              ref={categoryScrollRef}
              onScroll={handleCategoryScroll}
              style={{ 
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingLeft: showLeftArrow ? '2.5rem' : '0',
                paddingRight: showRightArrow ? '2.5rem' : '0',
                transition: 'padding 0.3s ease'
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `
              }} />
              <div style={{ 
                display: 'inline-flex',
                gap: isMobile ? '0.5rem' : '0.75rem',
                paddingBottom: '0.25rem'
              }}>
                {/* 「発音表記について」カテゴリーボタン（最初に表示） */}
                {categories.find(c => c.id === 'pronunciation') && (
                  <button
                    key="pronunciation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory('pronunciation');
                      setSelectedNoteCategory(null); // Noteカテゴリーを解除
                      setShowNoteSubCategories(false); // Noteサブカテゴリーを閉じる
                    }}
                    style={{
                      padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: '600',
                      borderRadius: '16px',
                      background: selectedCategory === 'pronunciation' 
                        ? 'linear-gradient(145deg, #6366f1, #4f46e5)' 
                        : 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                      color: selectedCategory === 'pronunciation' ? 'white' : '#1d1d1f',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedCategory === 'pronunciation' 
                        ? '0 4px 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                        : '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                      if (selectedCategory === 'pronunciation') {
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                      } else {
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      if (selectedCategory === 'pronunciation') {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                      } else {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';
                      }
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    }}
                  >
                    発音表記について
                  </button>
                )}
                
                {/* お気に入りボタン */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory('favorites');
                      setSelectedNoteCategory(null); // Noteカテゴリーを解除
                      setShowNoteSubCategories(false); // Noteサブカテゴリーを閉じる
                    }}
                    style={{
                      padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: '600',
                      borderRadius: '16px',
                      background: selectedCategory === 'favorites'
                        ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                        : 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                      color: selectedCategory === 'favorites' ? 'white' : '#1d1d1f',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selectedCategory === 'favorites'
                        ? '0 4px 12px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    }}
                  >
                    ⭐️ お気に入り
                  </button>
                )}
                
                {/* noteフレーズボタン */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playHapticAndSound();
                    // Noteサブカテゴリーの表示を切り替え
                    setShowNoteSubCategories(!showNoteSubCategories);
                    // 他のカテゴリーを選択解除（必要に応じて）
                    if (!showNoteSubCategories) {
                      setSelectedCategory(null);
                      setCurrentCategory(null);
                      setCurrentWords([]);
                    }
                  }}
                  style={{
                    padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    borderRadius: '16px',
                    background: showNoteSubCategories
                      ? 'linear-gradient(145deg, #3b82f6, #2563eb)'
                      : 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                    color: showNoteSubCategories ? 'white' : '#1d1d1f',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: showNoteSubCategories
                      ? '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                    transform: 'scale(1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    if (showNoteSubCategories) {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    if (showNoteSubCategories) {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                >
                  📝 noteフレーズ
                </button>
                
                {/* カテゴリーボタン（発音表記についてとNoteカテゴリーを除く） */}
                {categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_')).map((category) => {
                  return (
                    <button
                      key={category.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        playHapticAndSound();
                        setSelectedCategory(category.id);
                        setSelectedNoteCategory(null); // Noteカテゴリーを解除
                        setShowNoteSubCategories(false); // Noteサブカテゴリーを閉じる
                      }}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        borderRadius: '16px',
                        background: selectedCategory === category.id 
                          ? 'linear-gradient(145deg, #6366f1, #4f46e5)' 
                          : 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                        color: selectedCategory === category.id ? 'white' : '#1d1d1f',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: selectedCategory === category.id 
                          ? '0 4px 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        if (selectedCategory === category.id) {
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                        } else {
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        if (selectedCategory === category.id) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                        } else {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Noteサブカテゴリーバー（フロート形式） */}
            {showNoteSubCategories && (
              <div 
                onClick={(e) => {
                  // 外側をクリックした場合はサブカテゴリーバーを閉じる
                  if (e.target === e.currentTarget) {
                    setShowNoteSubCategories(false);
                  }
                }}
                style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                padding: isMobile ? '0 1rem' : '0 1.5rem',
                zIndex: 100,
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}>
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                  padding: isMobile ? '0.75rem 0' : '1rem 0',
                  position: 'relative'
                }}>
                  {/* 左スクロールインジケーター */}
                  {showNoteSubLeftArrow && (
                    <div style={{
                      position: 'absolute',
                      left: isMobile ? '1rem' : '1.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      opacity: 0.5,
                      pointerEvents: 'none',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      ⏪
                    </div>
                  )}
                  
                  {/* 右スクロールインジケーター */}
                  {showNoteSubRightArrow && (
                    <div style={{
                      position: 'absolute',
                      right: isMobile ? '1rem' : '1.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      opacity: 0.5,
                      pointerEvents: 'none',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      ⏩
                    </div>
                  )}
                  
                  <div 
                    ref={noteSubCategoryScrollRef}
                    onScroll={() => {
                      if (noteSubCategoryScrollRef.current) {
                        const { scrollLeft, scrollWidth, clientWidth } = noteSubCategoryScrollRef.current;
                        setShowNoteSubLeftArrow(scrollLeft > 0);
                        setShowNoteSubRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
                      }
                    }}
                    style={{ 
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      whiteSpace: 'nowrap',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      paddingLeft: showNoteSubLeftArrow ? '2.5rem' : '0',
                      paddingRight: showNoteSubRightArrow ? '2.5rem' : '0',
                      transition: 'padding 0.3s ease'
                    }}
                  >
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `
                    }} />
                    <div style={{ 
                      display: 'inline-flex',
                      gap: isMobile ? '0.5rem' : '0.75rem',
                      paddingBottom: '0.25rem'
                    }}>
                      {/* Note記事のサブカテゴリーボタン */}
                      {(noteCategoriesData as Category[]).map((noteCategory) => {
                        // 会員種別による表示制限
                        const isPremium = membershipType === 'subscription' || membershipType === 'lifetime';
                        const isFree = membershipType === 'free';
                        
                        // ブロンズ会員は部分的に表示（最初の記事のみ、または制限付き）
                        if (isFree && noteCategory.id !== 'note_na050a2a8ccfc') {
                          return null; // ブロンズ会員は最初の記事のみ表示
                        }
                        
                        const isSelected = selectedNoteCategory === noteCategory.id;
                        const noteUrl = (noteCategory as any).noteUrl;
                        
                        return (
                          <button
                            key={noteCategory.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              playHapticAndSound();
                              setSelectedNoteCategory(noteCategory.id);
                              setSelectedCategory(null); // 通常カテゴリーを解除
                              setCurrentCategory(noteCategory);
                              setCurrentWords(noteCategory.words || []);
                              setShowNoteSubCategories(false); // サブカテゴリーバーを閉じる
                            }}
                            style={{
                              padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              fontWeight: '600',
                              borderRadius: '16px',
                              background: isSelected
                                ? 'linear-gradient(145deg, #3b82f6, #2563eb)'
                                : 'linear-gradient(145deg, #f0f9ff, #e0f2fe)',
                              color: isSelected ? 'white' : '#1e40af',
                              border: isSelected ? 'none' : '1px solid rgba(59,130,246,0.2)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isSelected
                                ? '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                                : '0 2px 8px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                              transform: 'scale(1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                              if (isSelected) {
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                              } else {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.9)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              if (isSelected) {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                              } else {
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.9)';
                              }
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                            }}
                          >
                            <span>{noteCategory.name}</span>
                            {noteUrl && (
                              <a
                                href={noteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  backgroundColor: isSelected 
                                    ? 'rgba(255,255,255,0.2)' 
                                    : 'rgba(59,130,246,0.1)',
                                  color: isSelected ? 'white' : '#3b82f6',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isSelected 
                                    ? 'rgba(255,255,255,0.3)' 
                                    : 'rgba(59,130,246,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isSelected 
                                    ? 'rgba(255,255,255,0.2)' 
                                    : 'rgba(59,130,246,0.1)';
                                }}
                                title="Note記事を開く"
                              >
                                ↗
                              </a>
                            )}
                            {isFree && noteCategory.id === 'note_na050a2a8ccfc' && (
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                background: 'rgba(205,127,50,0.1)',
                                color: '#cd7f32',
                                fontWeight: '500'
                              }}>
                                無料
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

          

          {/* ユーザーアイコン（右上固定） */}
          <div style={{ position: 'fixed', top: isMobile ? 10 : 12, right: isMobile ? 10 : 12, zIndex: 50 }}>
            <button
              aria-label="アカウントメニュー"
              data-account-menu-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('アカウントメニューボタンクリック');
                setShowAccountMenu(v => !v);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('アカウントメニューボタンタッチ');
                setShowAccountMenu(v => !v);
              }}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: 9999,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <span style={{
                fontWeight: 700,
                color: '#111827'
              }}>{(user?.email?.[0] || 'G').toUpperCase()}</span>
            </button>

            {/* ドロップダウン */}
            {showAccountMenu && (
              <div 
                data-account-menu
                style={{
                position: 'absolute',
                right: 0,
                marginTop: 8,
                width: isMobile ? 'calc(100vw - 20px)' : 400,
                maxWidth: '90vw',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>サインイン中</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', wordBreak: 'break-all' }}>{user?.email || 'ゲスト'}</div>
                </div>
                <div style={{ padding: '10px 14px', display: 'grid', gap: 10 }}>
                  {/* 会員種別 */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>会員種別</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* ブロンズ会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ブロンズ会員ボタンクリック（アカウントメニュー）');
                          handleMembershipChange('free');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ブロンズ会員ボタンタッチ（アカウントメニュー）');
                          handleMembershipChange('free');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: 'none',
                          background: membershipType === 'free' 
                            ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'free' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s',
                          boxShadow: membershipType === 'free' 
                            ? '0 4px 12px rgba(205,127,50,0.3)' 
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          transform: membershipType === 'free' ? 'scale(1.02)' : 'scale(1)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>
                          {getMembershipIcon('free')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: membershipType === 'free' ? '#ffffff' : '#6b7280',
                          textShadow: membershipType === 'free' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                        }}>
                          {getMembershipLabel('free')}
                        </span>
                      </button>

                      {/* シルバー会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('シルバー会員ボタンクリック');
                          handleMembershipChange('subscription');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('シルバー会員ボタンタッチ');
                          handleMembershipChange('subscription');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: 'none',
                          background: membershipType === 'subscription' 
                            ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'subscription' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s',
                          boxShadow: membershipType === 'subscription' 
                            ? '0 4px 12px rgba(192,192,192,0.3)' 
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          transform: membershipType === 'subscription' ? 'scale(1.02)' : 'scale(1)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>
                          {getMembershipIcon('subscription')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: membershipType === 'subscription' ? '#1f2937' : '#6b7280',
                          textShadow: membershipType === 'subscription' ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                        }}>
                          {getMembershipLabel('subscription')}
                        </span>
                      </button>

                      {/* ゴールド会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ゴールド会員ボタンクリック');
                          handleMembershipChange('lifetime');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ゴールド会員ボタンタッチ');
                          handleMembershipChange('lifetime');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: 'none',
                          background: membershipType === 'lifetime' 
                            ? 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'lifetime' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s',
                          boxShadow: membershipType === 'lifetime' 
                            ? '0 4px 12px rgba(255,215,0,0.4)' 
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          transform: membershipType === 'lifetime' ? 'scale(1.02)' : 'scale(1)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>
                          {getMembershipIcon('lifetime')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: membershipType === 'lifetime' ? '#1f2937' : '#6b7280',
                          textShadow: membershipType === 'lifetime' ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                        }}>
                          {getMembershipLabel('lifetime')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* パワーアップボタン（ゴールド会員以外のみ表示） */}
                  {membershipType !== 'lifetime' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('パワーアップボタンクリック');
                        // 現在のプランより上位のプランを選択
                        const nextPlan = membershipType === 'free' ? 'subscription' : 'lifetime';
                        handleMembershipChange(nextPlan);
                        setShowAccountMenu(false);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('パワーアップボタンタッチ');
                        // 現在のプランより上位のプランを選択
                        const nextPlan = membershipType === 'free' ? 'subscription' : 'lifetime';
                        handleMembershipChange(nextPlan);
                        setShowAccountMenu(false);
                      }}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        background: 'linear-gradient(145deg, #6366f1, #4f46e5)',
                        color: 'white',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      {membershipType === 'free' ? 'シルバーにアップグレード' : 'ゴールドにアップグレード'}
                    </button>
                  )}

                  {/* 現在のプラン表示（ゴールド会員の場合） */}
                  {membershipType === 'lifetime' && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1f2937'
                    }}>
                      🏆 ゴールド会員（最高プラン）
                    </div>
                  )}

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  <div style={{ fontSize: 12, color: '#6b7280' }}>一般</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ color: '#374151' }}>あなたの言語</div>
                    <div style={{ marginLeft: 'auto', color: '#111827', fontWeight: 600 }}>日本語</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleClickSound();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleClickSound();
                    }}
                    style={{ 
                      height: 36, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: isClickSoundEnabled ? '#f0fdf4' : '#f9fafb', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}
                  </button>
                  <button
                    onClick={() => toggleLearningMode()}
                    style={{ 
                      height: 36, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: isLearningMode ? '#eff6ff' : '#f9fafb', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {isLearningMode ? '📚 学習モード' : '🎵 ノーマルモード'}
                  </button>

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  {/* デフォルトカテゴリー設定 */}
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>デフォルトで表示するカテゴリー</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ color: '#374151', flex: 1 }}>
                      {categories.find(c => c.id === defaultCategoryId)?.name || '発音表記について'}
                    </div>
                    {(membershipType === 'subscription' || membershipType === 'lifetime') ? (
                      <button
                        onClick={() => setShowCategoryPicker(true)}
                        disabled={isSavingDefaultCategory}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: isSavingDefaultCategory ? 'not-allowed' : 'pointer',
                          opacity: isSavingDefaultCategory ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isSavingDefaultCategory ? '保存中...' : '変更'}
                      </button>
                    ) : (
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#9ca3af',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        ブロンズは変更不可
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  <div style={{ fontSize: 12, color: '#6b7280' }}>アカウント情報</div>
                  
                  {/* ユーザーネーム */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>ユーザーネーム</label>
                    {!isEditingUsername ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{
                          flex: 1,
                          padding: '6px 8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          fontSize: 12,
                          color: '#1f2937'
                        }}>
                          {user?.user_metadata?.username || 'ユーザーネーム未設定'}
                        </div>
                        <button
                          onClick={() => {
                            setIsEditingUsername(true);
                            setNewUsername(user?.user_metadata?.username || '');
                            setUsernameError(null);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          変更
                        </button>
                      </div>
                    ) : (
                      <div>
                        {usernameError && (
                          <div style={{
                            padding: '6px 8px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            color: '#dc2626',
                            fontSize: 11,
                            marginBottom: 6
                          }}>
                            {usernameError}
                          </div>
                        )}
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 12,
                            marginBottom: 6,
                            boxSizing: 'border-box'
                          }}
                          placeholder="新しいユーザーネーム"
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={handleUsernameChange}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setUsernameError(null);
                              setNewUsername('');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* パスワード */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>パスワード</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{
                        flex: 1,
                        padding: '6px 8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                        color: '#1f2937'
                      }}>
                        ••••••••
                      </div>
                      <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        変更
                      </button>
                    </div>
                    
                    {/* パスワード変更フォーム */}
                    {showPasswordChange && (
                      <div style={{
                        marginTop: 8,
                        padding: 8,
                        backgroundColor: '#f0f9ff',
                        borderRadius: 6,
                        border: '1px solid #bfdbfe'
                      }}>
                        {passwordError && (
                          <div style={{
                            padding: '6px 8px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            color: '#dc2626',
                            fontSize: 11,
                            marginBottom: 6
                          }}>
                            {passwordError}
                          </div>
                        )}
                        {passwordSuccess && (
                          <div style={{
                            padding: '6px 8px',
                            backgroundColor: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                            color: '#16a34a',
                            fontSize: 11,
                            marginBottom: 6
                          }}>
                            パスワードが正常に変更されました
                          </div>
                        )}
                        <div style={{ marginBottom: 6, position: 'relative' }}>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              paddingRight: '2rem',
                              border: '1px solid #d1d5db',
                              borderRadius: 6,
                              fontSize: 12,
                              boxSizing: 'border-box'
                            }}
                            placeholder="新しいパスワード（6文字以上）"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#6b7280',
                              padding: '2px'
                            }}
                          >
                            {showNewPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <div style={{ marginBottom: 6, position: 'relative' }}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              paddingRight: '2rem',
                              border: '1px solid #d1d5db',
                              borderRadius: 6,
                              fontSize: 12,
                              boxSizing: 'border-box'
                            }}
                            placeholder="新しいパスワード（確認）"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#6b7280',
                              padding: '2px'
                            }}
                          >
                            {showConfirmPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={handlePasswordChange}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordChange(false);
                              setPasswordError(null);
                              setPasswordSuccess(false);
                              setNewPassword('');
                              setConfirmPassword('');
                              setShowNewPassword(false);
                              setShowConfirmPassword(false);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('ログアウトボタンクリック');
                      try {
                        setShowAccountMenu(false);
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          console.error('ログアウトエラー:', error);
                          alert('ログアウトに失敗しました: ' + error.message);
                        } else {
                          console.log('ログアウト成功');
                          router.refresh();
                          router.push('/login');
                        }
                      } catch (err) {
                        console.error('ログアウト例外:', err);
                        alert('ログアウトに失敗しました');
                      }
                    }}
                    onTouchStart={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('ログアウトボタンタッチ');
                      try {
                        setShowAccountMenu(false);
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          console.error('ログアウトエラー:', error);
                          alert('ログアウトに失敗しました: ' + error.message);
                        } else {
                          console.log('ログアウト成功');
                          router.refresh();
                          router.push('/login');
                        }
                      } catch (err) {
                        console.error('ログアウト例外:', err);
                        alert('ログアウトに失敗しました');
                      }
                    }}
                    style={{ 
                      height: 36, 
                      borderRadius: 8, 
                      border: '1px solid #e5e7eb', 
                      background: '#fff', 
                      cursor: 'pointer', 
                      fontWeight: 700,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      width: '100%',
                      fontSize: '14px'
                    }}
                  >ログアウト</button>
                </div>
              </div>
            )}
          </div>

          {/* 検索エリア */}
          <div style={{ 
            marginBottom: '1rem',
            padding: isMobile ? '0 1rem' : '0 1.5rem'
          }}>
            {/* 入力欄の小見出し（説明） */}
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: '#6b7280',
              margin: '0 0 0.375rem 0',
              lineHeight: 1.6
            }}>
              <div>・広東語の発音、意味を調べたい時、広東語を入力して🟦ボタン</div>
              <div>・日本語を広東語に翻訳したい時、日本語を入力して🟩ボタン</div>
              <div style={{ 
                fontSize: isMobile ? '0.7rem' : '0.8rem', 
                color: searchQuery.length > 900 ? '#ef4444' : '#9ca3af', 
                marginTop: '0.25rem',
                fontWeight: searchQuery.length > 900 ? '600' : '400'
              }}>
                入力可能文字数: {searchQuery.length} / 1,000文字
              </div>
            </div>
            {/* 入力欄＋右端アイコン用のラッパ（入力の高さに合わせて相対配置） */}
            <div style={{ position: 'relative' }}>
              <input
              type="text"
                placeholder="こちらに広東語、日本語を入力する"
              value={searchQuery}
                maxLength={1000}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // 最大文字数制限（1000文字）
                  if (newValue.length <= 1000) {
                    setSearchQuery(newValue);
                  } else {
                    // 制限を超えた場合は警告を表示（ただし、コピペなどで一気に入力された場合）
                    alert(`入力できる文字数は最大1,000文字です。現在の文字数: ${newValue.length}`);
                    setSearchQuery(newValue.substring(0, 1000));
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (blueLoading) return;
                    setBlueLoading(true);
                    try { await handleSearch(searchQuery); } finally { setBlueLoading(false); }
                  }
                }}
              style={{
                height: isMobile ? '3rem' : '3.5rem',
                fontSize: isMobile ? '1rem' : '1.125rem',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: '0 3.5rem 0 1.25rem',
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
              {/* 右端アイコン（入力欄の内側右上、白枠内） */}
              <div style={{
                position: 'absolute',
                right: isMobile ? '0.5rem' : '0.75rem',
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'transparent',
                border: 'none',
                padding: 0,
                boxShadow: 'none',
                zIndex: 3,
                pointerEvents: 'auto'
              }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="ファイルから読み取り (PDF/TXT)"
                  aria-label="ファイルから読み取り (PDF/TXT)"
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    color: '#6b7280',
                    width: isMobile ? 36 : 42,
                    height: isMobile ? 36 : 42,
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                  onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,122,255,0.25)'; e.currentTarget.style.background = '#f3f4f6'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <FolderIcon size={isMobile ? 22 : 24} yOffset={2} />
                </button>
                {isMobile && (
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  title="カメラ/OCRで読み取り"
                    aria-label="カメラ/OCRで読み取り"
                  style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      color: '#6b7280',
                      width: 36,
                      height: 36,
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                    onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,122,255,0.25)'; e.currentTarget.style.background = '#f3f4f6'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <CameraIcon size={isMobile ? 22 : 24} yOffset={2} />
                  </button>
                )}
              </div>
            </div>

            {/* 非表示input: PDF/画像（OCR対応、自動実行、HEIC対応） */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*,.heic,.heif"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsImporting(true);
                  setImportProgress(null);
                  setImportMessage('読み取り中...');
                  
                  const fileName = file.name.toLowerCase();
                  const fileType = file.type;
                  
                  // 画像ファイルの場合（自動OCR実行）
                  if (fileType.startsWith('image/')) {
                    setImportMessage('OCR実行中（中国語・広東語）...');
                    const text = await runOcr(file, (p) => setImportProgress(p));
                    if (!text || text.trim().length === 0) {
                      alert('画像からテキストを読み取れませんでした。');
                    } else {
                      // 文字数制限チェック（最大1000文字）
                      if (text.length > 1000) {
                        const confirmMsg = `OCRで読み取ったテキストが1,000文字を超えています（${text.length}文字）。\n最初の1,000文字のみを入力欄に設定しますか？`;
                        if (confirm(confirmMsg)) {
                          setSearchQuery(text.substring(0, 1000));
                          alert(`最初の1,000文字を入力欄に設定しました。`);
                        }
                      } else {
                        setSearchQuery(text);
                      }
                    }
                  }
                  // PDFファイルの場合（自動テキスト抽出→OCR）
                  else if (fileName.endsWith('.pdf')) {
                    setImportMessage('PDFからテキスト抽出中...');
                    let text = await extractTextFromPdf(file, (p) => setImportProgress(p));
                    
                    // テキストが抽出できない場合（スキャンPDF）、OCRを試す
                    if (!text || text.trim().length === 0) {
                      setImportMessage('PDFからテキストを抽出できませんでした。OCRで読み取り中...');
                      // PDFを画像としてOCR処理するため、Canvasに変換
                      try {
                        const pdfjsLib: any = await import('pdfjs-dist');
                        if (pdfjsLib?.GlobalWorkerOptions) {
                          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
                        }
                        const arrayBuffer = await file.arrayBuffer();
                        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                        const pdf = await loadingTask.promise;
                        const maxPages = Math.min(pdf.numPages, 5); // OCRは最大5ページまで
                        let ocrText = '';
                        
                        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                          const page = await pdf.getPage(pageNum);
                          // OCR精度向上のため、解像度を上げる（2.0 → 3.0）
                          const viewport = page.getViewport({ scale: 3.0 });
                          const canvas = document.createElement('canvas');
                          const context = canvas.getContext('2d');
                          if (!context) continue;
                          
                          canvas.height = viewport.height;
                          canvas.width = viewport.width;
                          
                          await page.render({ canvasContext: context, viewport }).promise;
                          
                          // CanvasをBlobに変換してOCR実行（Promiseでラップ）
                          const blob = await new Promise<Blob | null>((resolve) => {
                            canvas.toBlob((blob) => resolve(blob), 'image/png');
                          });
                          
                          if (blob) {
                            const imageFile = new File([blob], `page-${pageNum}.png`, { type: 'image/png' });
                            const pageText = await runOcr(imageFile, (p) => {
                              const totalProgress = ((pageNum - 1) / maxPages) * 100 + (p / maxPages);
                              setImportProgress(Math.round(totalProgress));
                            });
                            ocrText += pageText + '\n';
                          }
                        }
                        
                        text = ocrText.trim();
                        
                        if (!text || text.length === 0) {
                          alert('PDFからテキストを読み取れませんでした。');
                        } else {
                          // 文字数制限チェック（最大1000文字）
                          if (text.length > 1000) {
                            const confirmMsg = `PDFから読み取ったテキストが1,000文字を超えています（${text.length}文字）。\n最初の1,000文字のみを入力欄に設定しますか？`;
                            if (confirm(confirmMsg)) {
                              setSearchQuery(text.substring(0, 1000));
                              alert(`最初の1,000文字を入力欄に設定しました。`);
                            }
                          } else {
                            setSearchQuery(text);
                          }
                        }
                      } catch (ocrErr: any) {
                        console.error('PDF OCRエラー:', ocrErr);
                        alert('PDFのOCR処理中にエラーが発生しました: ' + (ocrErr?.message || String(ocrErr)));
                      }
                    } else {
                      // 文字数制限チェック（最大1000文字）
                      if (text.length > 1000) {
                        const confirmMsg = `PDFから抽出したテキストが1,000文字を超えています（${text.length}文字）。\n最初の1,000文字のみを入力欄に設定しますか？`;
                        if (confirm(confirmMsg)) {
                          setSearchQuery(text.substring(0, 1000));
                          alert(`最初の1,000文字を入力欄に設定しました。`);
                        }
                      } else {
                        setSearchQuery(text);
                      }
                    }
                  } else {
                    alert('PDFまたは画像ファイルを選択してください。');
                  }
                } catch (err: any) {
                  console.error(err);
                  alert('読み取り中にエラーが発生しました: ' + (err?.message || String(err)));
                } finally {
                  setIsImporting(false);
                  setImportProgress(null);
                  setImportMessage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />

            {/* 非表示input: カメラ（モバイルOCR） */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsImporting(true);
                  setImportMessage('OCR実行中...');
                  const text = await runOcr(file, (p) => setImportProgress(p));
                  // 文字数制限チェック（最大1000文字）
                  if (text.length > 1000) {
                    const confirmMsg = `OCRで読み取ったテキストが1,000文字を超えています（${text.length}文字）。\n最初の1,000文字のみを入力欄に設定しますか？`;
                    if (confirm(confirmMsg)) {
                      setSearchQuery(text.substring(0, 1000));
                      alert(`最初の1,000文字を入力欄に設定しました。`);
                    }
                  } else {
                    setSearchQuery(text);
                  }
                } catch (err: any) {
                  console.error(err);
                  alert('OCR中にエラーが発生しました: ' + (err?.message || String(err)));
                } finally {
                  setIsImporting(false);
                  setImportProgress(null);
                  setImportMessage(null);
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={async () => {
                  if (blueLoading) return;
                  playHapticAndSound();
                  setBlueLoading(true);
                  try { await handleSearch(searchQuery); } finally { setBlueLoading(false); }
                }}
                disabled={blueLoading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  borderRadius: '12px',
                  background: blueLoading ? 'linear-gradient(145deg, #d1d5db, #9ca3af)' : 'linear-gradient(145deg, #007AFF, #0051D5)',
                  color: 'white',
                  border: 'none',
                  cursor: blueLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  boxShadow: blueLoading ? '0 2px 6px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!blueLoading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,122,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!blueLoading) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!blueLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!blueLoading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                  }
                }}
              >
                {blueLoading ? '検索中...' : '広東語発音'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (greenLoading) return;
                  playHapticAndSound();
                  setGreenLoading(true);
                  try { await handleTranslateAndConvert(searchQuery); } finally { setGreenLoading(false); }
                }}
                disabled={greenLoading}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  borderRadius: '12px',
                  background: greenLoading ? 'linear-gradient(145deg, #d1d5db, #9ca3af)' : 'linear-gradient(145deg, #34C759, #248A3D)',
                  color: 'white',
                  border: 'none',
                  cursor: greenLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  boxShadow: greenLoading ? '0 2px 6px rgba(0,0,0,0.1)' : '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!greenLoading) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(52,199,89,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!greenLoading) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(52,199,89,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!greenLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!greenLoading) {
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

          {/* ノーマルモード用の非表示audio要素（常にDOMに存在） */}
          <audio 
            ref={normalModeAudioRef}
            style={{ display: 'none' }}
          />

          {/* 結果エリア（学習モード または 入力欄からの検索時に表示） */}
          {(result && (isLearningMode || forceShowResult)) && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: isMobile ? '1rem' : '1.5rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              background: 'white'
            }}>
              {/* 長文の場合の表示/非表示ボタン */}
              {((result.translatedText || searchQuery).length > 50) && (
                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowPronunciationDetails(!showPronunciationDetails)}
                    style={{
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      color: '#111827',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {showPronunciationDetails ? '発音を非表示' : '発音を表示'}
                  </button>
                </div>
              )}
              
              {/* 粤ピンとスラング式カタカナ（長文の場合は表示/非表示切り替え可能） */}
              {showPronunciationDetails && (
                <>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    <strong style={{ textDecoration: 'underline' }}>粤ピン： {result.jyutping}</strong>
                  </p>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    <strong style={{ textDecoration: 'underline' }}>スラング式カタカナ： {result.katakana}</strong>
                  </p>
                </>
              )}
              
              {/* 例文表示（翻訳された場合は非表示） */}
              {result.exampleCantonese && !result.translatedText && (
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
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    単語音声:
                  </p>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '0.5rem' }}>
                    {result.translatedText || searchQuery}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <audio 
                      ref={audioRef}
                      controls 
                      controlsList="nodownload nofullscreen noremoteplayback"
                      style={{ width: '300px', height: '32px', flexShrink: 0 }}
                      src={`data:audio/mp3;base64,${result.audioBase64}`}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <label style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>再生速度:</label>
                      <select 
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(e.target.value)}
                        style={{ 
                          padding: isMobile ? '6px 12px' : '8px 16px', 
                          fontSize: isMobile ? '0.875rem' : '1rem', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                          width: 'auto',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#007AFF';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.15), inset 0 1px 0 rgba(255,255,255,0.9)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)';
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
                    <button
                      onClick={async () => {
                        const textToCopy = result.translatedText || searchQuery;
                        try {
                          await navigator.clipboard.writeText(textToCopy);
                          setCopySuccess('単語');
                          setTimeout(() => setCopySuccess(null), 2000);
                        } catch (err) {
                          alert('コピーに失敗しました');
                        }
                      }}
                      title="テキストをコピー"
                      style={{
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                        cursor: 'pointer',
                        color: '#111827',
                        fontWeight: '600',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      📋 {copySuccess === '単語' ? 'コピーしました' : 'コピー'}
                    </button>
                  </div>
                </div>
              )}

              {/* 例文音声プレーヤー */}
              {result.exampleAudioBase64 && result.exampleCantonese && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    例文音声:
                  </p>
                  <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '0.5rem' }}>
                    {result.exampleCantonese}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <audio 
                      ref={exampleAudioRef}
                      controls 
                      controlsList="nodownload nofullscreen noremoteplayback"
                      style={{ width: '300px', height: '32px', flexShrink: 0 }}
                      src={`data:audio/mp3;base64,${result.exampleAudioBase64}`}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <label style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>再生速度:</label>
                      <select 
                        value={examplePlaybackSpeed}
                        onChange={(e) => setExamplePlaybackSpeed(e.target.value)}
                        style={{ 
                          padding: isMobile ? '6px 12px' : '8px 16px', 
                          fontSize: isMobile ? '0.875rem' : '1rem', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                          width: 'auto',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#007AFF';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.15), inset 0 1px 0 rgba(255,255,255,0.9)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)';
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
                    <button
                      onClick={async () => {
                        try {
                          if (result.exampleCantonese) {
                            await navigator.clipboard.writeText(result.exampleCantonese);
                            setCopySuccess('例文');
                            setTimeout(() => setCopySuccess(null), 2000);
                          }
                        } catch (err) {
                          alert('コピーに失敗しました');
                        }
                      }}
                      title="例文をコピー"
                      style={{
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'linear-gradient(145deg, #ffffff, #f5f5f7)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                        cursor: 'pointer',
                        color: '#111827',
                        fontWeight: '600',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      📋 {copySuccess === '例文' ? 'コピーしました' : 'コピー'}
                    </button>
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
                ref={(el) => {
                  // 隠しモード中は処理をスキップ（パフォーマンスとログの重複を防ぐ）
                  if (isHiddenMode) {
                    return;
                  }
                  
                  if (el && currentCategory.id === 'pronunciation') {
                    // 音声ボタンのイベントリスナーを設定
                    const toneButtons = el.querySelectorAll('.tone-audio-btn');
                    const sequenceButton = el.querySelector('.tone-sequence-btn');
                    
                    // 個別音声ボタン
                    toneButtons.forEach((btn) => {
                      const handler = (e: Event) => handleToneAudioClick(e);
                      btn.removeEventListener('click', handler as EventListener);
                      btn.addEventListener('click', handler as EventListener);
                    });
                    
                    // 連続発音ボタン（複数ある可能性があるためquerySelectorAllを使用）
                    const sequenceButtons = el.querySelectorAll('.tone-sequence-btn');
                    if (sequenceButtons.length > 0) {
                      // デバッグログを削除（パフォーマンス改善とログの重複防止）
                      sequenceButtons.forEach((btn, index) => {
                        const sequence = btn.getAttribute('data-sequence');
                        
                        // 既存のイベントリスナーをすべて削除（異なる関数参照を防ぐため）
                        const newBtn = btn.cloneNode(true) as HTMLElement;
                        btn.parentNode?.replaceChild(newBtn, btn);
                        
                        // クリックイベント
                        const clickHandler = (e: Event) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToneSequenceClick(e);
                        };
                        newBtn.addEventListener('click', clickHandler);
                        
                        // モバイル対応: タッチイベントも追加
                        const touchHandler = (e: Event) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToneSequenceClick(e);
                        };
                        newBtn.addEventListener('touchstart', touchHandler);
                        
                        // タッチアクションとスタイルを設定
                        (newBtn as HTMLElement).style.touchAction = 'manipulation';
                        (newBtn as HTMLElement).style.setProperty('-webkit-tap-highlight-color', 'transparent');
                      });
                    }
                  }
                }}
              />
              {currentCategory.practiceGroups.map((group, gIdx) => {
                // 練習⑦（おまけ）の場合は連続発音のみ
                const isOmake = group.name === '練習⑦';
                
                return (
                <div key={gIdx}>
                  <h3 style={{ 
                    fontSize: isMobile ? '1rem' : '1.25rem', 
                    fontWeight: 'bold', 
                    marginTop: '1rem', 
                    marginBottom: '0.5rem' 
                  }}>
                    {group.name === '練習⑦' ? 'おまけ' : group.name}
                  </h3>
                  
                  {/* おまけの場合 */}
                  {isOmake ? (
                    <>
                      <div style={{ 
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        連続発音
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        {group.words.map((word, wIdx) => {
                          const isActive = !isLearningMode && activeWordId === word.chinese;
                          // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                          const categoryId = selectedNoteCategory || currentCategory?.id || '';
                          const favoriteKey = `${categoryId}:${word.chinese}`;
                          const isFavorite = favorites.has(favoriteKey);
                          return (
                            <button
                              key={wIdx}
                              onClick={(e) => {
                                // 長押しが完了していた場合は通常クリックを防ぐ
                                if (longPressCompletedRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                                // 通常クリックの場合は音声を再生
                                e.preventDefault();
                                e.stopPropagation();
                                handleWordClick(word);
                              }}
                              onTouchStart={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onMouseUp={handleLongPressEnd}
                              onMouseLeave={handleLongPressEnd}
                              style={{
                                background: isActive 
                                  ? 'linear-gradient(145deg, #10b981, #059669)' 
                                  : 'white',
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
                              {/* 星マーク（右上） */}
                              {user && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '0.125rem',
                                    right: '0.125rem',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    textShadow: isFavorite ? '0 0 2px rgba(251, 191, 36, 0.5)' : 'none',
                                    filter: isFavorite ? 'drop-shadow(0 0 1px rgba(251, 191, 36, 0.8))' : 'none'
                                  }}
                                >
                                  {isFavorite ? '★' : '☆'}
                                </div>
                              )}
                              <strong style={{ 
                                fontSize: isMobile ? '1.25rem' : '1.875rem',
                                color: isActive ? '#ffffff' : '#1d1d1f'
                              }}>
                                {word.chinese}
                              </strong>
                              <div style={{ 
                                fontSize: isMobile ? '0.75rem' : '1rem',
                                color: isActive ? '#f0f0f0' : '#6e6e73'
                              }}>
                                {word.japanese}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* 通常の練習（①-⑥） */
                    <>
                      {/* 1-6声 */}
                      <div style={{ 
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        1-6声
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        {group.words.slice(0, 6).map((word, wIdx) => {
                          const isActive = !isLearningMode && activeWordId === word.chinese;
                          // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                          const categoryId = selectedNoteCategory || currentCategory?.id || '';
                          const favoriteKey = `${categoryId}:${word.chinese}`;
                          const isFavorite = favorites.has(favoriteKey);
                          return (
                            <button
                              key={wIdx}
                              onClick={(e) => {
                                // 長押しが完了していた場合は通常クリックを防ぐ
                                if (longPressCompletedRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                                // 通常クリックの場合は音声を再生
                                e.preventDefault();
                                e.stopPropagation();
                                handleWordClick(word);
                              }}
                              onTouchStart={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onMouseUp={handleLongPressEnd}
                              onMouseLeave={handleLongPressEnd}
                              style={{
                                background: isActive 
                                  ? 'linear-gradient(145deg, #10b981, #059669)' 
                                  : 'white',
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
                              {/* 星マーク（右上） */}
                              {user && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '0.125rem',
                                    right: '0.125rem',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    textShadow: isFavorite ? '0 0 2px rgba(251, 191, 36, 0.5)' : 'none',
                                    filter: isFavorite ? 'drop-shadow(0 0 1px rgba(251, 191, 36, 0.8))' : 'none'
                                  }}
                                >
                                  {isFavorite ? '★' : '☆'}
                                </div>
                              )}
                              <strong style={{ 
                                fontSize: isMobile ? '1.25rem' : '1.875rem',
                                color: isActive ? '#ffffff' : '#1d1d1f'
                              }}>
                                {word.chinese}
                              </strong>
                              <div style={{ 
                                fontSize: isMobile ? '0.75rem' : '1rem',
                                color: isActive ? '#f0f0f0' : '#6e6e73'
                              }}>
                                {word.japanese}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* 入声(p,t,k) */}
                      <div style={{ 
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        入声(p,t,k)
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        {group.words.slice(6, 9).map((word, wIdx) => {
                          const isActive = !isLearningMode && activeWordId === word.chinese;
                          // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                          const categoryId = selectedNoteCategory || currentCategory?.id || '';
                          const favoriteKey = `${categoryId}:${word.chinese}`;
                          const isFavorite = favorites.has(favoriteKey);
                          return (
                            <button
                              key={wIdx}
                              onClick={(e) => {
                                // 長押しが完了していた場合は通常クリックを防ぐ
                                if (longPressCompletedRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                                // 通常クリックの場合は音声を再生
                                e.preventDefault();
                                e.stopPropagation();
                                handleWordClick(word);
                              }}
                              onTouchStart={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onMouseUp={handleLongPressEnd}
                              onMouseLeave={handleLongPressEnd}
                              style={{
                                background: isActive 
                                  ? 'linear-gradient(145deg, #10b981, #059669)' 
                                  : 'white',
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
                              {/* 星マーク（右上） */}
                              {user && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '0.125rem',
                                    right: '0.125rem',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    textShadow: isFavorite ? '0 0 2px rgba(251, 191, 36, 0.5)' : 'none',
                                    filter: isFavorite ? 'drop-shadow(0 0 1px rgba(251, 191, 36, 0.8))' : 'none'
                                  }}
                                >
                                  {isFavorite ? '★' : '☆'}
                                </div>
                              )}
                              <strong style={{ 
                                fontSize: isMobile ? '1.25rem' : '1.875rem',
                                color: isActive ? '#ffffff' : '#1d1d1f'
                              }}>
                                {word.chinese}
                              </strong>
                              <div style={{ 
                                fontSize: isMobile ? '0.75rem' : '1rem',
                                color: isActive ? '#f0f0f0' : '#6e6e73'
                              }}>
                                {word.japanese}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* 連続発音 */}
                      <div style={{ 
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: 'bold',
                        marginTop: '0.75rem',
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        連続発音
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        {group.words.slice(9).map((word, wIdx) => {
                          const isActive = !isLearningMode && activeWordId === word.chinese;
                          // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                          const categoryId = selectedNoteCategory || currentCategory?.id || '';
                          const favoriteKey = `${categoryId}:${word.chinese}`;
                          const isFavorite = favorites.has(favoriteKey);
                          return (
                            <button
                              key={wIdx}
                              onClick={(e) => {
                                // 長押しが完了していた場合は通常クリックを防ぐ
                                if (longPressCompletedRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                                // 通常クリックの場合は音声を再生
                                e.preventDefault();
                                e.stopPropagation();
                                handleWordClick(word);
                              }}
                              onTouchStart={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                // noteカテゴリーが選択されている場合はselectedNoteCategoryを使用、それ以外はcurrentCategory.idを使用
                                const categoryId = selectedNoteCategory || currentCategory?.id || '';
                                handleLongPressStart(word, categoryId, e);
                              }}
                              onMouseUp={handleLongPressEnd}
                              onMouseLeave={handleLongPressEnd}
                              style={{
                                background: isActive 
                                  ? 'linear-gradient(145deg, #10b981, #059669)' 
                                  : 'white',
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
                              {/* 星マーク（右上） */}
                              {user && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '0.125rem',
                                    right: '0.125rem',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    textShadow: isFavorite ? '0 0 2px rgba(251, 191, 36, 0.5)' : 'none',
                                    filter: isFavorite ? 'drop-shadow(0 0 1px rgba(251, 191, 36, 0.8))' : 'none'
                                  }}
                                >
                                  {isFavorite ? '★' : '☆'}
                                </div>
                              )}
                              <strong style={{ 
                                fontSize: isMobile ? '1.25rem' : '1.875rem',
                                color: isActive ? '#ffffff' : '#1d1d1f'
                              }}>
                                {word.chinese}
                              </strong>
                              <div style={{ 
                                fontSize: isMobile ? '0.75rem' : '1rem',
                                color: isActive ? '#f0f0f0' : '#6e6e73'
                              }}>
                                {word.japanese}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
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
              {currentWords.map((word, idx) => {
                const isActive = !isLearningMode && activeWordId === word.chinese;
                // categoryIdの取得: お気に入り画面、noteカテゴリー、通常カテゴリーの順で優先
                const originalCategoryId = selectedCategory === 'favorites' 
                  ? (favoriteWordCategoryMapRef.current.get(word.chinese) || '')
                  : selectedNoteCategory 
                  ? selectedNoteCategory 
                  : (currentCategory?.id || '');
                const favoriteKey = `${originalCategoryId}:${word.chinese}`;
                const isFavorite = favorites.has(favoriteKey);
                return (
                <button
                  key={idx}
                  onClick={(e) => {
                    // 長押しが完了していた場合は通常クリックを防ぐ
                    if (longPressCompletedRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    // 通常クリックの場合は音声を再生
                    e.preventDefault();
                    e.stopPropagation();
                    handleWordClick(word);
                  }}
                  onTouchStart={(e) => {
                    // categoryIdの取得: お気に入り画面、noteカテゴリー、通常カテゴリーの順で優先
                    const categoryId = selectedCategory === 'favorites' 
                      ? (favoriteWordCategoryMapRef.current.get(word.chinese) || '')
                      : selectedNoteCategory 
                      ? selectedNoteCategory 
                      : (currentCategory?.id || '');
                    handleLongPressStart(word, categoryId, e);
                  }}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  style={{
                    background: isActive 
                      ? 'linear-gradient(145deg, #10b981, #059669)' 
                      : 'linear-gradient(145deg, #ffffff, #f5f5f7)',
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
                    handleLongPressEnd(e);
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                    // categoryIdの取得: お気に入り画面、noteカテゴリー、通常カテゴリーの順で優先
                    const categoryId = selectedCategory === 'favorites' 
                      ? (favoriteWordCategoryMapRef.current.get(word.chinese) || '')
                      : selectedNoteCategory 
                      ? selectedNoteCategory 
                      : (currentCategory?.id || '');
                    handleLongPressStart(word, categoryId, e);
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                    handleLongPressEnd(e);
                  }}
                >
                  {/* 星マーク（右上） */}
                  {user && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        zIndex: 10,
                        userSelect: 'none',
                        pointerEvents: 'none',
                        color: isFavorite ? '#fbbf24' : '#9ca3af',
                        textShadow: isFavorite ? '0 0 2px rgba(251, 191, 36, 0.5)' : 'none',
                        filter: isFavorite ? 'drop-shadow(0 0 1px rgba(251, 191, 36, 0.8))' : 'none'
                      }}
                    >
                      {isFavorite ? '★' : '☆'}
                    </div>
                  )}
                  <strong style={{ 
                    fontSize: isMobile ? '1.5rem' : '1.875rem',
                    fontWeight: '600',
                    color: isActive ? '#ffffff' : '#1d1d1f',
                    marginBottom: '0.25rem'
                  }}>
                    {word.chinese}
                  </strong>
                  <div style={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: isActive ? '#f0f0f0' : '#6e6e73',
                    fontWeight: '400'
                  }}>
                    {word.japanese}
                  </div>
                </button>
                );
              })}
            </div>
          )}

        </div>

        {/* フッター（デザイン踏襲） */}
        <footer style={{ padding: isMobile ? '1.5rem' : '2rem', color: '#4b5563', marginTop: '3rem' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            alignItems: 'center'
          }}>
            <a href="/cantonese" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6'
            }}>カントン語（広東語）ってなに？</a>
            <span style={{ color: '#9ca3af' }}>·</span>
            <a href="/about" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6',
              fontWeight: '500'
            }}>カントン語音れんって何？</a>
            <span style={{ color: '#9ca3af' }}>·</span>
            <a href="/updates" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6' 
            }}>更新情報</a>
            <span style={{ color: '#9ca3af' }}>·</span>
            <a href="/faq" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6' 
            }}>FAQ</a>
            <span style={{ color: '#9ca3af' }}>·</span>
            <a href="/contact" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6' 
            }}>お問い合わせ</a>
            <span style={{ color: '#9ca3af' }}>·</span>
            <a href="/legal/terms" style={{ 
              textDecoration: 'underline', 
              color: '#3b82f6' 
            }}>利用規約</a>
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#6b7280' }}>
            © 2024 LIFESUPPORT(HK)  All Right Reserved.
          </div>
        </footer>

        {/* 料金モーダル */}
        {showPricingModal && selectedPlan && (
          <div 
            onClick={(e) => {
              // 外側をクリックした場合はモーダルを閉じる
              if (e.target === e.currentTarget) {
                setShowPricingModal(false);
                setSelectedPlan(null);
                setIsDowngrade(false);
              }
            }}
            onTouchMove={(e) => {
              // モーダル外のタッチスクロールを防ぐ
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
            style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
            overflow: 'hidden',
            touchAction: 'none'
          }}>
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: isMobile ? '90vh' : '85vh',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              // PC版でも確実に高さを制限（すべてのプランでスクロール可能にする）
              height: isMobile ? 'auto' : '85vh'
            }}>
              {/* ヘッダー */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: selectedPlan === 'free'
                  ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)'
                  : selectedPlan === 'subscription' 
                  ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                  : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)',
                flexShrink: 0
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                }}>
                  <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                    {selectedPlan === 'free' ? '🥉' : selectedPlan === 'subscription' ? '🥈' : '🏆'}
                  </span>
                  <span>
                    {selectedPlan === 'free' ? 'ブロンズ会員' : selectedPlan === 'subscription' ? 'シルバー会員' : 'ゴールド会員'}
                  </span>
                </h2>
                <button
                  onClick={() => {
                    setShowPricingModal(false);
                    setSelectedPlan(null);
                    setIsDowngrade(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              {/* コンテンツ（スクロール可能） */}
              <div style={{ 
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* 上スクロールインジケーター */}
                {showPricingModalTopArrow && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    fontSize: '1.5rem',
                    opacity: 0.7,
                    pointerEvents: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    color: '#6b7280'
                  }}>
                    ↑
                  </div>
                )}
                
                {/* 下スクロールインジケーター */}
                {showPricingModalBottomArrow && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    fontSize: '1.5rem',
                    opacity: 0.7,
                    pointerEvents: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    color: '#6b7280'
                  }}>
                    ↓
                  </div>
                )}
                
                <div 
                  ref={pricingModalScrollRef}
                  onScroll={() => {
                    if (pricingModalScrollRef.current) {
                      const { scrollTop, scrollHeight, clientHeight } = pricingModalScrollRef.current;
                      const canScroll = scrollHeight > clientHeight;
                      const isAtTop = scrollTop <= 10;
                      const isAtBottom = scrollTop >= scrollHeight - clientHeight - 10;
                      
                      if (canScroll) {
                        setShowPricingModalTopArrow(!isAtTop);
                        setShowPricingModalBottomArrow(!isAtBottom);
                      } else {
                        setShowPricingModalTopArrow(false);
                        setShowPricingModalBottomArrow(false);
                      }
                    }
                  }}
                  style={{ 
                    padding: '1.5rem',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flex: 1,
                    minHeight: 0,
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: showPricingModalTopArrow ? '2rem' : '1.5rem',
                    paddingBottom: showPricingModalBottomArrow ? '2rem' : '1.5rem',
                    transition: 'padding 0.3s ease',
                    // PC版でも確実にスクロール可能にするためのスタイル
                    maxHeight: '100%',
                    height: '100%'
                  }}
                >
                {/* 価格 */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: selectedPlan === 'free' 
                      ? '#a85f1f'
                      : selectedPlan === 'subscription' 
                      ? '#6b7280' 
                      : '#d97706',
                    textShadow: selectedPlan === 'free'
                      ? '0 2px 4px rgba(0,0,0,0.1)'
                      : selectedPlan === 'subscription' 
                      ? '0 2px 4px rgba(0,0,0,0.1)' 
                      : '0 2px 4px rgba(255,215,0,0.3)'
                  }}>
                    {selectedPlan === 'free' ? '無料' : selectedPlan === 'subscription' ? '¥980' : '¥9,800'}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    {selectedPlan === 'free' 
                      ? '（お気に入り6個まで）' 
                      : selectedPlan === 'subscription' 
                      ? '月額（自動更新）' 
                      : '買い切り（永久使用）'}
                  </div>
                </div>

                {/* 特典 */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                  }}>特典</h3>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {(selectedPlan === 'free' 
                      ? ['基本カテゴリーの単語へアクセス', 'お気に入り6個まで', '発音チェックゲーム']
                      : selectedPlan === 'subscription'
                      ? ['お気に入り無制限', 'モード切り替え (ノーマルモード・学習)', 'note 教科書自動更新', 'テキストOCR', '発音チェック', '発音チェックゲーム', '全カテゴリーの単語へアクセス', '音声速度調整', '広告なし']
                      : ['お気に入り無制限', 'モード切り替え (ノーマルモード・学習)', 'note 教科書自動更新', 'テキストOCR', '発音チェック', '発音チェックゲーム', '全カテゴリーの単語へアクセス', '音声速度調整', '広告なし']
                    ).map((benefit, idx) => (
                      <li key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span>
                        <span style={{ color: '#1f2937' }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                </div>

              </div>
              
              {/* フッター（ボタンエリア - 固定） */}
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                flexShrink: 0
              }}>
                <button
                  onClick={() => handleStripeCheckout(selectedPlan)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: selectedPlan === 'free'
                      ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)'
                      : selectedPlan === 'subscription' 
                      ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                      : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: selectedPlan === 'free'
                      ? '0 4px 12px rgba(205,127,50,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                      : selectedPlan === 'subscription' 
                      ? '0 4px 12px rgba(192,192,192,0.4), inset 0 1px 0 rgba(255,255,255,0.4)' 
                      : '0 4px 12px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                    textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                  }}
                >
                  {isDowngrade ? '今すぐダウングレード' : '今すぐアップグレード'}
                </button>

                <div style={{
                  marginTop: '1rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#9ca3af'
                }}>
                  {selectedPlan === 'free'
                    ? 'お気に入りは6個までに制限されます'
                    : selectedPlan === 'subscription' 
                    ? 'いつでもキャンセル可能です' 
                    : '一度のお支払いで永久に使用できます'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* iOS風カテゴリーピッカーモーダル */}
        {showCategoryPicker && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCategoryPicker(false);
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '500px',
                backgroundColor: 'white',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                paddingBottom: 'env(safe-area-inset-bottom)',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* ヘッダー */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>カテゴリーを選択</h3>
                <button
                  onClick={() => {
                    // 完了時に選択中のカテゴリーを保存
                    if (categoryPickerScrollRef.current) {
                      const scrollTop = categoryPickerScrollRef.current.scrollTop;
                      const itemHeight = 60;
                      const centerOffset = categoryPickerScrollRef.current.clientHeight / 2 - itemHeight / 2;
                      const selectedIndex = Math.round((scrollTop + centerOffset) / itemHeight);
                      
                      const allCategories = [
                        ...(categories.find(c => c.id === 'pronunciation') ? [{ id: 'pronunciation', name: '発音表記について' }] : []),
                        ...categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_'))
                      ];
                      
                      if (selectedIndex >= 0 && selectedIndex < allCategories.length) {
                        const selectedCategory = allCategories[selectedIndex];
                        handleDefaultCategoryChange(selectedCategory.id);
                      } else {
                        setShowCategoryPicker(false);
                      }
                    } else {
                      setShowCategoryPicker(false);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: '#3b82f6',
                    fontWeight: '600'
                  }}
                >
                  完了
                </button>
              </div>

              {/* ロール型ピッカー */}
              <div style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* 中央の選択エリアのハイライト */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '60px',
                  marginTop: '-30px',
                  borderTop: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />
                
                {/* ピッカーホイール */}
                <div
                  id="category-picker-scroll"
                  ref={(el) => {
                    categoryPickerScrollRef.current = el;
                    if (el && showCategoryPicker) {
                      // スクロール位置を選択中のカテゴリーに合わせる
                      const allCategories = [
                        ...(categories.find(c => c.id === 'pronunciation') ? [{ id: 'pronunciation', name: '発音表記について' }] : []),
                        ...categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_'))
                      ];
                      const selectedIndex = allCategories.findIndex(c => c.id === defaultCategoryId);
                      if (selectedIndex >= 0) {
                        setTimeout(() => {
                          const itemHeight = 60;
                          const centerOffset = el.clientHeight / 2 - itemHeight / 2;
                          el.scrollTop = selectedIndex * itemHeight - centerOffset;
                        }, 100);
                      }
                    }
                  }}
                  onScroll={(e) => {
                    const scrollTop = e.currentTarget.scrollTop;
                    const itemHeight = 60;
                    const centerOffset = e.currentTarget.clientHeight / 2 - itemHeight / 2;
                    const selectedIndex = Math.round((scrollTop + centerOffset) / itemHeight);
                    
                    const allCategories = [
                      ...(categories.find(c => c.id === 'pronunciation') ? [{ id: 'pronunciation', name: '発音表記について' }] : []),
                      ...categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_'))
                    ];
                    
                    if (selectedIndex >= 0 && selectedIndex < allCategories.length) {
                      const selectedCategory = allCategories[selectedIndex];
                      if (selectedCategory.id !== defaultCategoryId) {
                        setDefaultCategoryId(selectedCategory.id);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingTop: '50%',
                    paddingBottom: '50%',
                    boxSizing: 'border-box'
                  }}
                >
                  <style>{`
                    #category-picker-scroll::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  
                  {/* 発音表記についてを最初に表示 */}
                  {categories.find(c => c.id === 'pronunciation') && (
                    <div
                      onClick={() => {
                        if (categoryPickerScrollRef.current) {
                          const itemHeight = 60;
                          const centerOffset = categoryPickerScrollRef.current.clientHeight / 2 - itemHeight / 2;
                          categoryPickerScrollRef.current.scrollTo({ 
                            top: 0 - centerOffset, 
                            behavior: 'smooth' 
                          });
                          setTimeout(() => handleDefaultCategoryChange('pronunciation'), 300);
                        }
                      }}
                      style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        scrollSnapAlign: 'center',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        fontWeight: defaultCategoryId === 'pronunciation' ? '600' : '400',
                        color: defaultCategoryId === 'pronunciation' ? '#1e40af' : '#6b7280',
                        transition: 'all 0.2s',
                        transform: defaultCategoryId === 'pronunciation' ? 'scale(1.1)' : 'scale(1)',
                        opacity: defaultCategoryId === 'pronunciation' ? 1 : 0.6
                      }}
                    >
                      発音表記について
                    </div>
                  )}
                  {/* その他のカテゴリー */}
                  {categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_')).map((category, index) => {
                    const allCategories = [
                      ...(categories.find(c => c.id === 'pronunciation') ? [{ id: 'pronunciation', name: '発音表記について' }] : []),
                      ...categories.filter(c => c.id !== 'pronunciation' && !c.id.startsWith('note_'))
                    ];
                    const categoryIndex = allCategories.findIndex(c => c.id === category.id);
                    const isSelected = category.id === defaultCategoryId;
                    const distanceFromCenter = Math.abs(categoryIndex - allCategories.findIndex(c => c.id === defaultCategoryId));
                    const scale = Math.max(0.8, 1 - distanceFromCenter * 0.1);
                    const opacity = Math.max(0.4, 1 - distanceFromCenter * 0.2);
                    
                    return (
                      <div
                        key={category.id}
                        onClick={() => {
                          if (categoryPickerScrollRef.current) {
                            const itemHeight = 60;
                            const centerOffset = categoryPickerScrollRef.current.clientHeight / 2 - itemHeight / 2;
                            categoryPickerScrollRef.current.scrollTo({ 
                              top: categoryIndex * itemHeight - centerOffset, 
                              behavior: 'smooth' 
                            });
                            setTimeout(() => handleDefaultCategoryChange(category.id), 300);
                          }
                        }}
                        style={{
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          scrollSnapAlign: 'center',
                          cursor: 'pointer',
                          fontSize: isSelected ? '1.25rem' : '1rem',
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#1e40af' : '#6b7280',
                          transition: 'all 0.2s',
                          transform: `scale(${scale})`,
                          opacity: opacity
                        }}
                      >
                        {category.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 設定画面モーダル（右側スライドイン） */}
        {showSettings && user && (
          <div
            onClick={(e) => {
              // 外側をクリックした場合は設定を閉じる
              if (e.target === e.currentTarget) {
                setShowSettings(false);
                setShowPasswordChange(false);
                setPasswordError(null);
                setPasswordSuccess(false);
                setNewPassword('');
                setConfirmPassword('');
              }
            }}
            style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            {/* 背景オーバーレイ（左側のスペース） */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(false);
                setShowPasswordChange(false);
                setPasswordError(null);
                setPasswordSuccess(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: isMobile ? 0 : '400px',
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              transition: 'opacity 0.3s ease',
              cursor: 'pointer'
            }} />
            {/* 設定パネル（右側） */}
            <div 
              data-settings-panel
              onClick={(e) => e.stopPropagation()}
              style={{
              position: 'relative',
              width: isMobile ? '100%' : '400px',
              maxWidth: '90vw',
              height: '100%',
              backgroundColor: 'white',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              overflowY: 'auto',
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease'
            }}>
              {/* ヘッダー */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>⚙️ 設定</h2>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowPasswordChange(false);
                    setPasswordError(null);
                    setPasswordSuccess(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              {/* コンテンツ */}
              <div style={{ padding: '1.5rem' }}>
                {/* ユーザー情報 */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                  }}>アカウント情報</h3>

                  {/* デフォルトカテゴリー設定 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>デフォルトで表示するカテゴリー</label>
                    
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '1rem',
                        color: '#1f2937'
                      }}>
                        {categories.find(c => c.id === defaultCategoryId)?.name || '発音表記について'}
                      </div>
                      {(membershipType === 'subscription' || membershipType === 'lifetime') ? (
                        <button
                          onClick={() => setShowCategoryPicker(true)}
                          disabled={isSavingDefaultCategory}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isSavingDefaultCategory ? 'not-allowed' : 'pointer',
                            opacity: isSavingDefaultCategory ? 0.6 : 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isSavingDefaultCategory ? '保存中...' : '変更'}
                        </button>
                      ) : (
                        <div style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          ブロンズは変更不可
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ユーザーネーム */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>ユーザーネーム</label>
                    
                    {!isEditingUsername ? (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '1rem',
                          color: '#1f2937'
                        }}>
                          {user.user_metadata?.username || 'ユーザーネーム未設定'}
                        </div>
                        <button
                          onClick={() => {
                            setIsEditingUsername(true);
                            setNewUsername(user.user_metadata?.username || '');
                            setUsernameError(null);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          変更
                        </button>
                      </div>
                    ) : (
                      <div>
                        {usernameError && (
                          <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            marginBottom: '0.75rem'
                          }}>
                            {usernameError}
                          </div>
                        )}
                        
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            marginBottom: '0.75rem',
                            boxSizing: 'border-box'
                          }}
                          placeholder="新しいユーザーネーム"
                        />
                        
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          <button
                            type="button"
                            onClick={handleUsernameChange}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setUsernameError(null);
                              setNewUsername('');
                            }}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 登録メール */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>登録メール</label>
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}>
                      {user.email}
                    </div>
                  </div>

                  {/* パスワード */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>パスワード</label>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '1rem',
                        color: '#1f2937'
                      }}>
                        ••••••••
                      </div>
                      <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        変更
                      </button>
                    </div>
                  </div>

                  {/* ご登録期日 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>ご登録期日</label>
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}>
                      {user.created_at ? (() => {
                        const date = new Date(user.created_at);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}年${month}月${day}日`;
                      })() : '登録日不明'}
                    </div>
                  </div>

                  {/* パスワード変更フォーム */}
                  {showPasswordChange && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        color: '#1e40af'
                      }}>パスワード変更</h4>

                      {passwordError && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}>
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: '#dcfce7',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          color: '#16a34a',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}>
                          パスワードが正常に変更されました
                        </div>
                      )}

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>新しいパスワード</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              paddingRight: '3rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                            placeholder="6文字以上、英数字記号"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.25rem',
                              color: '#6b7280',
                              padding: '0.25rem'
                            }}
                          >
                            {showNewPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>新しいパスワード（確認）</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              paddingRight: '3rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                            placeholder="もう一度入力"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.25rem',
                              color: '#6b7280',
                              padding: '0.25rem'
                            }}
                          >
                            {showConfirmPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 変更するボタンがクリックされました');
                            console.log('現在の入力値:', { newPassword: newPassword ? 'あり' : 'なし', confirmPassword: confirmPassword ? 'あり' : 'なし' });
                            await handlePasswordChange();
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          変更する
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 キャンセルボタンがクリックされました');
                            setShowPasswordChange(false);
                            setPasswordError(null);
                            setNewPassword('');
                            setConfirmPassword('');
                            setShowNewPassword(false);
                            setShowConfirmPassword(false);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 会員種別 */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.75rem'
                    }}>会員種別</label>
                    
                    {/* スライドトグル */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {/* ブロンズ会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ブロンズ会員ボタンクリック（設定画面）');
                          handleMembershipChange('free');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ブロンズ会員ボタンタッチ（設定画面）');
                          handleMembershipChange('free');
                        }}
                        style={{
                          flex: 1,
                          padding: '1.25rem 0.75rem',
                          borderRadius: '16px',
                          border: 'none',
                          background: membershipType === 'free' 
                            ? 'linear-gradient(145deg, #d4a574 0%, #cd7f32 50%, #a85f1f 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'free' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s',
                          boxShadow: membershipType === 'free' 
                            ? '0 8px 20px rgba(205,127,50,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transform: membershipType === 'free' ? 'scale(1.05)' : 'scale(1)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (membershipType !== 'free') {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (membershipType !== 'free') {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                          {getMembershipIcon('free')}
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: membershipType === 'free' ? '#ffffff' : '#6b7280',
                          textShadow: membershipType === 'free' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                        }}>
                          {getMembershipLabel('free')}
                        </span>
                      </button>

                      {/* シルバー会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('シルバー会員ボタンクリック（設定画面）');
                          handleMembershipChange('subscription');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('シルバー会員ボタンタッチ（設定画面）');
                          handleMembershipChange('subscription');
                        }}
                        style={{
                          flex: 1,
                          padding: '1.25rem 0.75rem',
                          borderRadius: '16px',
                          border: 'none',
                          background: membershipType === 'subscription' 
                            ? 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'subscription' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s',
                          boxShadow: membershipType === 'subscription' 
                            ? '0 8px 20px rgba(192,192,192,0.4), inset 0 1px 0 rgba(255,255,255,0.4)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transform: membershipType === 'subscription' ? 'scale(1.05)' : 'scale(1)',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (membershipType !== 'subscription') {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (membershipType !== 'subscription') {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                          {getMembershipIcon('subscription')}
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: membershipType === 'subscription' ? '#1f2937' : '#6b7280',
                          textShadow: membershipType === 'subscription' ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                        }}>
                          {getMembershipLabel('subscription')}
                        </span>
                        {membershipType !== 'subscription' && membershipType !== 'lifetime' && (
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontWeight: '700'
                          }}>
                            ¥980/月
                          </span>
                        )}
                      </button>

                      {/* ゴールド会員 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ゴールド会員ボタンクリック（設定画面）');
                          handleMembershipChange('lifetime');
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ゴールド会員ボタンタッチ（設定画面）');
                          handleMembershipChange('lifetime');
                        }}
                        style={{
                          flex: 1,
                          padding: '1.25rem 0.75rem',
                          borderRadius: '16px',
                          border: 'none',
                          background: membershipType === 'lifetime' 
                            ? 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)' 
                            : 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
                          cursor: membershipType === 'lifetime' ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s',
                          boxShadow: membershipType === 'lifetime' 
                            ? '0 8px 20px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transform: membershipType === 'lifetime' ? 'scale(1.05)' : 'scale(1)',
                          position: 'relative',
                          overflow: 'hidden',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (membershipType !== 'lifetime') {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (membershipType !== 'lifetime') {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                          {getMembershipIcon('lifetime')}
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: membershipType === 'lifetime' ? '#1f2937' : '#6b7280',
                          textShadow: membershipType === 'lifetime' ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                        }}>
                          {getMembershipLabel('lifetime')}
                        </span>
                        {membershipType !== 'lifetime' && (
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontWeight: '700'
                          }}>
                            ¥9,800
                          </span>
                        )}
                      </button>
                    </div>

                    {/* 会員種別比較表 */}
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        marginBottom: '1rem',
                        color: '#1f2937',
                        textAlign: 'center'
                      }}>📊 プラン比較</h3>
                      
                      <div style={{
                        overflowX: 'auto'
                      }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '0.875rem'
                        }}>
                          <thead>
                            <tr>
                              <th style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                borderBottom: '2px solid #d1d5db',
                                fontWeight: '600',
                                color: '#374151',
                                backgroundColor: '#ffffff'
                              }}>機能・特典</th>
                              <th style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '2px solid #d1d5db',
                                fontWeight: '600',
                                color: '#374151',
                                backgroundColor: '#ffffff'
                              }}>🥉 ブロンズ</th>
                              <th style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '2px solid #d1d5db',
                                fontWeight: '600',
                                color: '#374151',
                                backgroundColor: '#ffffff'
                              }}>🥈 シルバー</th>
                              <th style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '2px solid #d1d5db',
                                fontWeight: '600',
                                color: '#374151',
                                backgroundColor: '#ffffff'
                              }}>🏆 ゴールド</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>価格</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#a85f1f',
                                fontWeight: '600'
                              }}>無料</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#6b7280',
                                fontWeight: '600'
                              }}>¥980/月</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#d97706',
                                fontWeight: '600'
                              }}>¥9,800</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>カテゴリーアクセス</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#6b7280'
                              }}>基本</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ 全カテゴリー</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ 全カテゴリー</td>
                            </tr>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>お気に入り数</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#6b7280'
                              }}>6個まで</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ 無制限</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ 無制限</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>音声速度調整</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#ef4444'
                              }}>✗</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓</td>
                            </tr>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>広告</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#ef4444'
                              }}>✗ あり</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ なし</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓ なし</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <td style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>オフライン使用</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#ef4444'
                              }}>✗</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                borderBottom: '1px solid #e5e7eb',
                                color: '#10b981',
                                fontWeight: '600'
                              }}>✓</td>
                            </tr>
                            <tr style={{ backgroundColor: '#ffffff' }}>
                              <td style={{
                                padding: '0.75rem',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>支払い方法</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                color: '#6b7280'
                              }}>-</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                color: '#6b7280'
                              }}>月額自動更新</td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center',
                                color: '#6b7280'
                              }}>買い切り</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* デバッグ情報（自動表示） */}
                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#1e40af'
                  }}>🔍 Supabaseデータ確認結果</h3>
                  
                  {loadingDebugInfo ? (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      確認中...
                    </div>
                  ) : debugInfo ? (
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Email:</strong> {debugInfo.email}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Username:</strong> {debugInfo.username ? `✅ ${debugInfo.username}` : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Membership:</strong> {debugInfo.membership_type ? `✅ ${debugInfo.membership_type}` : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Password:</strong> {debugInfo.has_password ? '✅ 設定済み' : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Last Sign In:</strong> {debugInfo.last_sign_in_at ? new Date(debugInfo.last_sign_in_at).toLocaleString('ja-JP') : '❌ 未設定'}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Updated At:</strong> {debugInfo.updated_at ? new Date(debugInfo.updated_at).toLocaleString('ja-JP') : '❌ 未設定'}
                      </div>
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', overflow: 'auto' }}>
                        <strong>Full Metadata:</strong>
                        <pre style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(debugInfo.full_metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                      ❌ データ取得に失敗しました
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
