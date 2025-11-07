'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('セッションIDが見つかりません。');
      setLoading(false);
      return;
    }

    // ユーザー情報を再取得して会員種別を更新
    const updateUserMembership = async () => {
      try {
        const supabase = createClient();
        
        // Webhookの処理を待つため、少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ユーザー情報を再取得（Webhookで更新されているはず）
        const { data: { user: updatedUser }, error: refreshError } = await supabase.auth.getUser();
        
        if (refreshError) {
          console.error('ユーザー情報の再取得エラー:', refreshError);
          throw new Error('ユーザー情報の取得に失敗しました。');
        }

        if (!updatedUser) {
          throw new Error('ユーザー情報が見つかりません。');
        }

        console.log('✅ 決済後のユーザー情報:', {
          userId: updatedUser.id,
          membershipType: updatedUser.user_metadata?.membership_type,
          subscriptionExpiresAt: updatedUser.user_metadata?.subscription_expires_at,
          fullMetadata: updatedUser.user_metadata
        });

        // usersテーブルからも確認
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('membership_type, subscription_expires_at')
          .eq('id', updatedUser.id)
          .maybeSingle();

        if (!dbError && userData) {
          console.log('✅ usersテーブルの情報:', userData);
        } else if (dbError) {
          console.warn('⚠️ usersテーブルからの取得エラー（無視）:', dbError);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Payment success error:', err);
        setError(err.message || 'エラーが発生しました。');
        setLoading(false);
      }
    };

    updateUserMembership();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '1rem'
        }}>
          支払い処理中...
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#6b7280'
        }}>
          お待ちください
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ef4444',
          marginBottom: '1rem'
        }}>
          エラーが発生しました
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem'
      }}>
        ✅
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        支払いが完了しました！
      </div>
      <div style={{
        fontSize: '1rem',
        color: '#6b7280',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        ご利用ありがとうございます。プランが有効になりました。
      </div>
      <button
        onClick={() => router.push('/')}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          color: 'white',
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        ホームに戻る
      </button>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '1rem'
        }}>
          読み込み中...
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

