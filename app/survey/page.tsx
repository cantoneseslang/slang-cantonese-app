'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SurveyPage() {
  const [gender, setGender] = useState('');
  const [residence, setResidence] = useState('');
  const [residenceOther, setResidenceOther] = useState('');
  const [cantoneseLevel, setCantoneseLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  useEffect(() => {
    const checkAuthAndSurvey = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 既にアンケートが完了している場合はホームにリダイレクト
      if (user.user_metadata?.survey_completed) {
        router.push('/');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuthAndSurvey();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // バリデーション
    if (!gender) {
      setError('性別を選択してください');
      setLoading(false);
      return;
    }
    if (!residence) {
      setError('居住地を選択してください');
      setLoading(false);
      return;
    }
    if (residence === '海外' && !residenceOther.trim()) {
      setError('居住地の詳細を入力してください');
      setLoading(false);
      return;
    }
    if (!cantoneseLevel) {
      setError('広東語レベルを選択してください');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          residence,
          residenceOther: residence === '海外' ? residenceOther : null,
          cantoneseLevel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'アンケートの保存に失敗しました');
      }

      // ホームページにリダイレクト
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'アンケートの保存に失敗しました');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          簡易アンケート
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#374151',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          サービス向上のため、簡単なアンケートにご協力ください
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#991b1b',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 性別 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              1. 性別 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {['男性', '女性', '答えたくない'].map((option) => (
                <label key={option} style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}>
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* 居住地 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              2. 居住地 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={residence}
              onChange={(e) => {
                setResidence(e.target.value);
                if (e.target.value !== '海外') {
                  setResidenceOther('');
                }
              }}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '0.75rem'
              }}
            >
              <option value="">選択してください</option>
              <optgroup label="日本の都道府県">
                {prefectures.map((pref) => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </optgroup>
              <option value="海外">海外</option>
            </select>
            
            {residence === '海外' && (
              <input
                type="text"
                value={residenceOther}
                onChange={(e) => setResidenceOther(e.target.value)}
                placeholder="国名または地域名を入力してください"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            )}
          </div>

          {/* 広東語レベル */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              3. 広東語レベル <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { value: '初心者', label: '初心者（発音すら習ったことない）' },
                { value: '中級者', label: '中級者（学校に行った、独学である程度勉強し、基本単語はわかる）' },
                { value: '上級者', label: '上級者（香港のローカルの方と遜色なく会話が可能である）' }
              ].map((option) => (
                <label key={option.value} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: '0.75rem',
                  backgroundColor: cantoneseLevel === option.value ? '#eff6ff' : 'transparent',
                  border: cantoneseLevel === option.value ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="cantoneseLevel"
                    value={option.value}
                    checked={cantoneseLevel === option.value}
                    onChange={(e) => setCantoneseLevel(e.target.value)}
                    style={{ marginRight: '0.75rem', marginTop: '0.125rem' }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '送信中...' : '送信して完了'}
          </button>
        </form>
      </div>
    </div>
  );
}

