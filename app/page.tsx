'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [blueLoading, setBlueLoading] = useState(false);
  const [greenLoading, setGreenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('pronunciation');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

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
  const [showMiniCompare, setShowMiniCompare] = useState(false); // アカウントメニュー内の簡易比較
  
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

    // お気に入りの読み込み
    useEffect(() => {
      const loadFavorites = async () => {
        if (!user) {
          setFavorites(new Set());
          return;
        }

        try {
          setLoadingFavorites(true);
          const response = await fetch('/api/favorites/list');
          const data = await response.json();
          
          if (data.success && data.favoriteSet) {
            setFavorites(new Set(data.favoriteSet));
          } else if (data.error) {
            // エラーがあっても静かに処理（テーブルが存在しない場合など）
            console.warn('お気に入り読み込み警告:', data.error);
            setFavorites(new Set());
          } else {
            setFavorites(new Set());
          }
        } catch (error) {
          // ネットワークエラーなどは静かに処理
          console.error('お気に入り読み込みエラー:', error);
          setFavorites(new Set());
        } finally {
          setLoadingFavorites(false);
        }
      };

      loadFavorites();
    }, [user]);

  // お気に入りの追加/削除
  const toggleFavorite = async (word: Word, categoryId: string) => {
    if (!user) {
      return; // ログインしていない場合は静かに処理
    }

    const favoriteKey = `${categoryId}:${word.chinese}`;
    const isFavorite = favorites.has(favoriteKey);

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
        if (data.success) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(favoriteKey);
          setFavorites(newFavorites);
        } else {
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
        
        // レスポンスステータスをチェック（403は制限エラー）
        if (response.status === 403) {
          // バックエンドからの制限エラーを表示
          const errorMsg = data.error || 'ブロンズ会員はお気に入りを6個までしか保存できません。';
          alert(errorMsg);
          return;
        }
        
        if (data.success) {
          const newFavorites = new Set(favorites);
          newFavorites.add(favoriteKey);
          setFavorites(newFavorites);
        } else {
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
    
    longPressCompletedRef.current = false;
    longPressWordRef.current = { word, categoryId };
    
    longPressTimerRef.current = setTimeout(() => {
      if (longPressWordRef.current) {
        longPressCompletedRef.current = true;
        playHapticAndSound();
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
      }, 200);
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
    // 現在の会員種別と同じ場合は何もしない
    if (membershipType === newType) {
      return;
    }

    // ダウングレードかどうかを判定
    const isDowngrading = (
      (membershipType === 'lifetime' && (newType === 'subscription' || newType === 'free')) ||
      (membershipType === 'subscription' && newType === 'free')
    );
    
    // すべての変更で料金モーダルを表示
    setIsDowngrade(isDowngrading);
    setSelectedPlan(newType);
    setShowPricingModal(true);
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

      setMembershipType(plan);
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

  // PDFテキスト抽出（pdfjs-dist）
  const extractTextFromPdf = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
    const pdfjsLib: any = await import('pdfjs-dist/build/pdf');
    // CDNのworkerを設定（バンドル不要）
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 10); // 上限
    let fullText = '';
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((it: any) => it.str);
      fullText += strings.join(' ') + '\n';
      if (onProgress) onProgress(Math.round((pageNum / maxPages) * 100));
    }
    const normalized = fullText
      .replace(/\u00A0/g, ' ')
      .replace(/[\t\v\f]+/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();
    return normalized.length > 4000 ? normalized.slice(0, 4000) : normalized;
  };

  // 画像OCR（Tesseract.js）
  const runOcr = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
    const Tesseract: any = await import('tesseract.js');
    const { createWorker } = Tesseract as any;
    const worker = await createWorker({
      logger: (m: any) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100));
        }
      }
    });
    // 日本語+英語（サイズ大きいが汎用性）
    await worker.loadLanguage('jpn+eng');
    await worker.initialize('jpn+eng');
    const result = await worker.recognize(await file.arrayBuffer());
    await worker.terminate();
    const text = String(result?.data?.text || '').replace(/\s{3,}/g, ' ').trim();
    return text.length > 4000 ? text.slice(0, 4000) : text;
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
          const category = categories.find(c => c.id === categoryId);
          if (category && category.words) {
            const word = category.words.find(w => w.chinese === wordChinese);
            if (word) {
              favoriteWords.push({ ...word, chinese: word.chinese });
              categoryMap.set(word.chinese, categoryId); // 元のcategoryIdを保存
            }
          }
          // practiceGroupsからも検索
          if (category && category.practiceGroups) {
            category.practiceGroups.forEach(group => {
              const word = group.words.find(w => w.chinese === wordChinese);
              if (word && !favoriteWords.find(w => w.chinese === wordChinese)) {
                favoriteWords.push({ ...word, chinese: word.chinese });
                categoryMap.set(word.chinese, categoryId); // 元のcategoryIdを保存
              }
            });
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
    }
  }, [selectedCategory, categories, favorites]);

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

  // 初期スクロール位置（左端から開始）
  useEffect(() => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft = 0;
      handleCategoryScroll();
    }
  }, [isMobile]);

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

  const handleSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setError('検索文字を入力してください');
      return;
    }

    // 入力欄からの検索は、学習モードでなくても結果パネルを表示する
    setForceShowResult(true);

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
    // すべてのモードで押下ログを送信
    try { fetch('/api/track-button', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordChinese: word.chinese, categoryId: currentCategory?.id }) }); } catch {}
    
    if (isLearningMode) {
      // 学習モード：現在の動作（例文も表示）
      setSearchQuery(word.chinese);
      await handleSearch(word.chinese);
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
          normalModeAudioRef.current.play();
        }
      }
    } catch (err) {
      console.error('音声再生エラー:', err);
    }
  try { fetch('/api/track-button', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordChinese: text, categoryId: currentCategory?.id || 'pronunciation' }) }); } catch {}
  };

  // 連続発音ボタンのクリックハンドラー
  const handleToneSequenceClick = async (e: Event) => {
    const button = e.target as HTMLButtonElement;
    const sequence = button.getAttribute('data-sequence');
    if (!sequence) return;

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

    // 連続発音
    const texts = sequence.split(',').map(t => t.trim());
    const textMap: { [key: string]: string } = {
      '3': '3',
      '9': '9',
      '4': '4',
      '0': '0',
      '5': '5',
      '2': '2',
      '7': '7',
      '8': '8',
      '6': '6'
    };

    for (let i = 0; i < texts.length; i++) {
      const text = textMap[texts[i]] || texts[i];
      
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
            
            // 最後の音声でない場合は、次の音声まで待つ
            if (i < texts.length - 1) {
              await new Promise<void>((resolve) => {
                if (normalModeAudioRef.current) {
                  normalModeAudioRef.current.onended = () => {
                    resolve();
                  };
                  normalModeAudioRef.current.play();
                } else {
                  resolve();
                }
              });
              // 短い間隔を追加
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              normalModeAudioRef.current.play();
            }
          }
        }
      } catch (err) {
        console.error('音声再生エラー:', err);
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
        padding: isMobile ? '1rem' : '3rem', 
        backgroundColor: '#f3f4f6', 
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
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
              <p style={{ marginBottom: '0.75rem', display: 'none' }}>
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
                  ジャンル分け(トータル45ジャンル収録)は右側で押して切り替えを行なってください
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  音声練習用に音声再生スピードの変更可能です
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
              <p style={{ marginBottom: '0.75rem' }}>
                スラング先生考案!カントン語音れん☝️(全{totalButtons}単語)収録！
              </p>
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
            <div style={{ marginBottom: '0.25rem' }}>
              <img src="/volume-logo.png?v=1" alt="logo" style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56 }} />
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
            padding: isMobile ? '0 1rem' : '0 1.5rem'
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
                {/* 左側の隠れメニュー */}
                {user && (
                  <>
                    {false && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
                      }}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        borderRadius: '16px',
                        background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                      }}
                    >
                      ログアウト
                    </button>
                    )}
                    {false && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleClickSound();
                      }}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        borderRadius: '16px',
                        background: isClickSoundEnabled 
                          ? 'linear-gradient(145deg, #10b981, #059669)' 
                          : 'linear-gradient(145deg, #6b7280, #4b5563)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isClickSoundEnabled
                          ? '0 4px 12px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : '0 4px 12px rgba(107,114,128,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
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
                      {isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}
                    </button>
                    )}
                    {false && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLearningMode();
                      }}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        borderRadius: '16px',
                        background: isLearningMode 
                          ? 'linear-gradient(145deg, #3b82f6, #2563eb)' 
                          : 'linear-gradient(145deg, #6b7280, #4b5563)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isLearningMode
                          ? '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : '0 4px 12px rgba(107,114,128,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
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
                      {isLearningMode ? '📚 学習モード' : '🎵 ノーマルモード'}
                    </button>
                    )}
                    {false && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSettings(true);
                      }}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        borderRadius: '16px',
                        background: 'linear-gradient(145deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
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
                      ⚙️ 設定
                    </button>
                    )}
                  </>
                )}
                
                {/* 「発音表記について」カテゴリーボタン（最初に表示） */}
                {categories.find(c => c.id === 'pronunciation') && (
                  <button
                    key="pronunciation"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory('pronunciation');
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
                
                {/* カテゴリーボタン（発音表記についてを除く） */}
                {categories.filter(c => c.id !== 'pronunciation').map((category) => (
                  <button
                    key={category.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playHapticAndSound();
                      setSelectedCategory(category.id);
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
                ))}
              </div>
            </div>
        </div>

          

          {/* ユーザーアイコン（右上固定） */}
          <div style={{ position: 'fixed', top: isMobile ? 10 : 12, right: isMobile ? 10 : 12, zIndex: 50 }}>
            <button
              aria-label="アカウントメニュー"
              onClick={() => setShowAccountMenu(v => !v)}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: 9999,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <span style={{
                fontWeight: 700,
                color: '#111827'
              }}>{(user?.email?.[0] || 'G').toUpperCase()}</span>
            </button>

            {/* ドロップダウン */}
            {showAccountMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                marginTop: 8,
                width: 280,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>サインイン中</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', wordBreak: 'break-all' }}>{user?.email || 'ゲスト'}</div>
                </div>
                <div style={{ padding: '10px 14px', display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#374151' }}>現在ご加入プラン</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {membershipType === 'free' ? '無料プラン' : membershipType === 'subscription' ? 'シルバー（月額）' : 'ゴールド（買い切り）'}
                    </div>
                  </div>
                  {/* 会員種別（設定から移設） */}
                  <div style={{ fontSize: 12, color: '#6b7280' }}>会員種別</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <button
                      onClick={() => { setIsDowngrade(membershipType!=='free'); setSelectedPlan('free'); setShowPricingModal(true); setShowAccountMenu(false); }}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827' }}
                    >🥉 ブロンズ会員</button>
                    <button
                      onClick={() => { setIsDowngrade(membershipType==='lifetime'); setSelectedPlan('subscription'); setShowPricingModal(true); setShowAccountMenu(false); }}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827' }}
                    >🥈 シルバー会員</button>
                    <button
                      onClick={() => { setIsDowngrade(false); setSelectedPlan('lifetime'); setShowPricingModal(true); setShowAccountMenu(false); }}
                      style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827' }}
                    >🏆 ゴールド会員</button>
                  </div>
                  <button
                    onClick={() => setShowMiniCompare(v=>!v)}
                    style={{ height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827' }}
                  >📊 プラン比較</button>
                  {showMiniCompare && (
                    <div style={{ fontSize: 12, color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                        <div style={{ fontWeight: 700 }}>機能</div>
                        <div style={{ fontWeight: 700 }}>🥉</div>
                        <div style={{ fontWeight: 700 }}>🥈</div>
                        <div style={{ fontWeight: 700 }}>🏆</div>
                        <div>価格</div><div>無料</div><div>¥980/月</div><div>¥9,800</div>
                        <div>カテゴリー</div><div>基本</div><div>✓ 全</div><div>✓ 全</div>
                        <div>お気に入り</div><div>6個</div><div>✓ 無制限</div><div>✓ 無制限</div>
                        <div>速度調整</div><div>✗</div><div>✓</div><div>✓</div>
                        <div>広告</div><div>✗ あり</div><div>✓ なし</div><div>✓ なし</div>
                        <div>オフライン</div><div>✗</div><div>✓</div><div>✓</div>
                      </div>
                    </div>
                  )}

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  <div style={{ fontSize: 12, color: '#6b7280' }}>一般</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ color: '#374151' }}>あなたの言語</div>
                    <div style={{ marginLeft: 'auto', color: '#111827', fontWeight: 600 }}>日本語</div>
                  </div>

                  {/* ユーティリティ操作（元のヘッダーから移動） */}
                  <button
                    onClick={() => toggleClickSound()}
                    style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827', padding: '0 12px' }}
                  >{isClickSoundEnabled ? '🔊 クリック音オン' : '🔇 クリック音オフ'}</button>
                  <button
                    onClick={() => toggleLearningMode()}
                    style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827', padding: '0 12px' }}
                  >{isLearningMode ? '📚 学習モード' : '🎵 ノーマルモード'}</button>
                  {/* 設定ボタン不要 */}

                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                  <div style={{ fontSize: 12, color: '#6b7280' }}>アカウント</div>
                  {/* アカウント情報（編集機能付き） */}
                  <div style={{ fontSize: 12, color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>ユーザーネーム</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{user?.user_metadata?.username || '未設定'}</span>
                        <button
                          onClick={() => { setShowAccountMenu(false); setShowSettings(true); setIsEditingUsername(true); }}
                          style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
                        >変更</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>登録メール</span>
                      <span style={{ fontWeight: 700 }}>{user?.email || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>パスワード</span>
                      <button
                        onClick={() => { setShowAccountMenu(false); setShowSettings(true); setShowPasswordChange(true); }}
                        style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, color: '#111827' }}
                      >変更</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ご登録期日</span>
                      <span style={{ fontWeight: 700 }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : '-'}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => { setShowAccountMenu(false); await supabase.auth.signOut(); router.refresh(); }}
                    style={{ height: 36, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#111827', padding: '0 12px' }}
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
            </div>
            {/* 入力欄＋右端アイコン用のラッパ（入力の高さに合わせて相対配置） */}
            <div style={{ position: 'relative' }}>
              <input
              type="text"
                placeholder="こちらに広東語、日本語を入力する"
              value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* 非表示input: PDF/TXT */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsImporting(true);
                  setImportProgress(null);
                  setImportMessage('読み取り中...');
                  if (file.name.toLowerCase().endsWith('.txt')) {
                    const text = await readTxt(file);
                    setSearchQuery(text);
                  } else if (file.name.toLowerCase().endsWith('.pdf')) {
                    const text = await extractTextFromPdf(file, (p) => setImportProgress(p));
                    if (!text || text.trim().length === 0) {
                      alert('PDFからテキストを抽出できませんでした。スキャンPDFの可能性があります。モバイルの📷からOCRをお試しください。');
                    } else {
                      setSearchQuery(text);
                    }
                  } else {
                    alert('PDF または TXT ファイルを選択してください。');
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
                  setSearchQuery(text);
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
                ref={(el) => {
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
                    
                    // 連続発音ボタン
                    if (sequenceButton) {
                      const handler = (e: Event) => handleToneSequenceClick(e);
                      sequenceButton.removeEventListener('click', handler as EventListener);
                      sequenceButton.addEventListener('click', handler as EventListener);
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
                          const favoriteKey = `${currentCategory?.id || ''}:${word.chinese}`;
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
                                handleLongPressStart(word, currentCategory?.id || '', e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                handleLongPressStart(word, currentCategory?.id || '', e);
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
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    WebkitTextStroke: isFavorite ? 'none' : '1px #9ca3af',
                                    WebkitTextFillColor: isFavorite ? '#fbbf24' : 'transparent'
                                  }}
                                >
                                  ★
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
                          const favoriteKey = `${currentCategory?.id || ''}:${word.chinese}`;
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
                                handleLongPressStart(word, currentCategory?.id || '', e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                handleLongPressStart(word, currentCategory?.id || '', e);
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
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    WebkitTextStroke: isFavorite ? 'none' : '1px #9ca3af',
                                    WebkitTextFillColor: isFavorite ? '#fbbf24' : 'transparent'
                                  }}
                                >
                                  ★
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
                          const favoriteKey = `${currentCategory?.id || ''}:${word.chinese}`;
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
                                handleLongPressStart(word, currentCategory?.id || '', e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                handleLongPressStart(word, currentCategory?.id || '', e);
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
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    WebkitTextStroke: isFavorite ? 'none' : '1px #9ca3af',
                                    WebkitTextFillColor: isFavorite ? '#fbbf24' : 'transparent'
                                  }}
                                >
                                  ★
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
                          const favoriteKey = `${currentCategory?.id || ''}:${word.chinese}`;
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
                                handleLongPressStart(word, currentCategory?.id || '', e);
                              }}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                              onMouseDown={(e) => {
                                handleLongPressStart(word, currentCategory?.id || '', e);
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
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    color: isFavorite ? '#fbbf24' : '#9ca3af',
                                    WebkitTextStroke: isFavorite ? 'none' : '1px #9ca3af',
                                    WebkitTextFillColor: isFavorite ? '#fbbf24' : 'transparent'
                                  }}
                                >
                                  ★
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
                // お気に入り画面の場合は元のcategoryIdを使う
                const originalCategoryId = selectedCategory === 'favorites' 
                  ? (favoriteWordCategoryMapRef.current.get(word.chinese) || '')
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
                    handleLongPressStart(word, originalCategoryId, e);
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
                    handleLongPressEnd();
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                    const originalCategoryId = selectedCategory === 'favorites' 
                      ? (favoriteWordCategoryMapRef.current.get(word.chinese) || '')
                      : (currentCategory?.id || '');
                    handleLongPressStart(word, originalCategoryId, e);
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                    handleLongPressEnd();
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
                        cursor: 'pointer',
                        zIndex: 10,
                        userSelect: 'none',
                        pointerEvents: 'none',
                        color: isFavorite ? '#fbbf24' : '#9ca3af',
                        WebkitTextStroke: isFavorite ? 'none' : '1px #9ca3af',
                        WebkitTextFillColor: isFavorite ? '#fbbf24' : 'transparent'
                      }}
                    >
                      ★
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
        <footer style={{ padding: isMobile ? '1.5rem' : '2rem', color: '#4b5563' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem'
          }}>
            <a href="/about" style={{ textDecoration: 'underline' }}>カントン語音れんって何？</a>
            <span>·</span>
            <a href="/updates" style={{ textDecoration: 'underline' }}>更新情報</a>
            <span>·</span>
            <a href="/faq" style={{ textDecoration: 'underline' }}>FAQ</a>
            <span>·</span>
            <a href="/contact" style={{ textDecoration: 'underline' }}>お問い合わせ</a>
            <span>·</span>
            <a href="/legal/terms" style={{ textDecoration: 'underline' }}>利用規約</a>
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#6b7280' }}>
            © 2024 LIFESUPPORT(HK)  All Right Reserved.
          </div>
        </footer>

        {/* 料金モーダル */}
        {showPricingModal && selectedPlan && (
          <div style={{
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
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
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
                  : 'linear-gradient(145deg, #ffe066 0%, #ffd700 50%, #ffb700 100%)'
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

              {/* コンテンツ */}
              <div style={{ padding: '1.5rem' }}>
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
                    {selectedPlan === 'free' 
                      ? ['基本カテゴリーの単語へアクセス', 'お気に入り6個まで'].map((benefit, idx) => (
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
                      ))
                      : ['全カテゴリーの単語へアクセス', '例文音声の速度調整機能', '広告なし', 'オフライン使用可能'].map((benefit, idx) => (
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
                      ))
                    }
                  </ul>
                </div>

                {/* ボタン */}
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

        {/* 設定画面モーダル */}
        {showSettings && user && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative'
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
                        onClick={() => handleMembershipChange('free')}
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
                          transform: membershipType === 'free' ? 'scale(1.05)' : 'scale(1)'
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
                        onClick={() => handleMembershipChange('subscription')}
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
                          transform: membershipType === 'subscription' ? 'scale(1.05)' : 'scale(1)'
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
                        onClick={() => handleMembershipChange('lifetime')}
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
                          overflow: 'hidden'
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
