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
        
        // 即座にverify-sessionを実行（Webhookを待たない）
        console.log('🔄 即座にverify-sessionを実行します...');
        let verifyData: any = null;
        try {
          const verifyResponse = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (verifyResponse.ok) {
            verifyData = await verifyResponse.json();
            console.log('✅ verify-session完了:', verifyData);
          } else {
            const errorData = await verifyResponse.json();
            console.error('❌ verify-sessionエラー:', errorData);
          }
        } catch (error: any) {
          console.error('❌ verify-sessionエラー:', error);
        }

        // Webhookの処理を待つ（1秒待機）
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ユーザー情報を再取得（Webhookで更新されている可能性がある）
        const { data: { user: updatedUser }, error: refreshError } = await supabase.auth.getUser();
        
        if (refreshError || !updatedUser) {
          throw new Error('ユーザー情報の取得に失敗しました。');
        }

        // 会員種別が既に更新されているか確認
        const currentMembershipType = updatedUser.user_metadata?.membership_type;
        
        // まだ更新されていない場合、またはverify-sessionが失敗した場合、再度処理を試みる
        if (!verifyData || !verifyData.success || currentMembershipType === 'free' || (currentMembershipType === 'subscription' && sessionId)) {
            console.log('⚠️ Webhookで更新されていないため、セッションを直接確認します', {
              sessionId,
              currentMembershipType,
              userId: updatedUser.id
            });
            
            // まずverify-sessionを試す（即座に実行、待機なし）
            let verifyData: any = null;
            try {
              console.log('🔄 verify-sessionを即座に実行します...');
              const verifyResponse = await fetch('/api/stripe/verify-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              });

              if (verifyResponse.ok) {
                verifyData = await verifyResponse.json();
                console.log('✅ セッション確認完了:', verifyData);
                
                if (!verifyData.success) {
                  console.warn('⚠️ verify-sessionが成功したが、会員種別の更新に失敗');
                } else {
                  console.log('✅ verify-sessionで会員種別が更新されました:', verifyData.membershipType);
                }
              } else {
                const errorData = await verifyResponse.json();
                console.error('❌ セッション確認エラー:', {
                  status: verifyResponse.status,
                  statusText: verifyResponse.statusText,
                  error: errorData
                });
              }
            } catch (error: any) {
              console.error('❌ verify-sessionエラー:', error);
            }

            // verify-sessionが失敗した場合、またはまだ更新されていない場合、手動更新を試す
            if (!verifyData || !verifyData.success) {
              console.log('🔄 手動更新を試みます...');
              try {
                // verify-sessionからplanを取得できた場合はそれを使用
                let planToUse = verifyData?.membershipType;
                
                // planが取得できなかった場合、sessionIdから直接セッションを取得
                if (!planToUse) {
                  console.log('📋 セッションからplanを取得します...');
                  // verify-sessionエンドポイントを直接呼び出してplanを取得
                  // ただし、更新処理はスキップするため、別の方法で取得
                  try {
                    // Stripe APIを直接呼び出す代わりに、verify-sessionのレスポンスから取得
                    // verify-sessionが失敗した場合でも、エラーレスポンスにplanが含まれている可能性がある
                    if (verifyData && verifyData.error) {
                      console.log('⚠️ verify-sessionエラー:', verifyData.error);
                    }
                  } catch (e) {
                    console.error('セッション取得エラー:', e);
                  }
                  
                  // フォールバック: セッションIDから推測（amount_totalから）
                  // 9800円または49800 HKD = lifetime, 980円 = subscription
                  // ただし、これは確実ではないため、手動更新APIでsessionIdから取得する
                }

                // sessionIdを渡せば、manual-update-membershipが自動的にplanを検出する
                const manualResponse = await fetch('/api/stripe/manual-update-membership', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    sessionId,
                    userId: updatedUser.id,
                    plan: planToUse // 取得できた場合は使用、なければundefined（API側で検出）
                  }),
                });

                if (manualResponse.ok) {
                  const manualData = await manualResponse.json();
                  console.log('✅ 手動更新完了:', manualData);
                  // 手動更新が成功した場合、verifyDataを更新
                  verifyData = { 
                    success: true, 
                    membershipType: manualData.plan || planToUse 
                  };
                } else {
                  const errorData = await manualResponse.json();
                  console.error('❌ 手動更新エラー:', errorData);
                }
              } catch (error: any) {
                console.error('❌ 手動更新エラー:', error);
              }
            }
            
            if (!verifyData || !verifyData.success) {
              throw new Error('セッション確認と手動更新の両方が失敗しました。管理者に連絡してください。');
            }

          // user_metadataの更新が反映されるまで少し待機
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // セッションをリフレッシュして最新のuser_metadataを取得
          let retryCount = 0;
          let finalUser = null;
          
          while (retryCount < 3 && !finalUser) {
            const { data: { session }, error: refreshSessionError } = await supabase.auth.refreshSession();
            
            if (refreshSessionError) {
              console.warn(`⚠️ セッションリフレッシュエラー（試行 ${retryCount + 1}/3）:`, refreshSessionError);
            }
            
            // ユーザー情報を再取得
            const { data: { user }, error: getUserError } = await supabase.auth.getUser();
            
            if (!getUserError && user) {
              // user_metadataが更新されているか確認
              if (user.user_metadata?.membership_type && user.user_metadata.membership_type !== 'free') {
                finalUser = user;
                console.log(`✅ ユーザー情報の更新を確認（試行 ${retryCount + 1}/3）:`, {
                  membershipType: user.user_metadata.membership_type
                });
                break;
              } else {
                console.log(`⏳ ユーザー情報の更新を待機中（試行 ${retryCount + 1}/3）...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            retryCount++;
          }
          
          const { data: { user: finalUserFallback }, error: finalError } = await supabase.auth.getUser();
          finalUser = finalUser || finalUserFallback;
          
          if (finalError || !finalUser) {
            throw new Error('ユーザー情報の再取得に失敗しました。');
          }

          console.log('✅ 最終的なユーザー情報:', {
            userId: finalUser.id,
            membershipType: finalUser.user_metadata?.membership_type,
            subscriptionExpiresAt: finalUser.user_metadata?.subscription_expires_at,
          });
        } else {
          // Webhookで既に更新済みの場合も、セッションをリフレッシュして最新の情報を取得
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          let retryCount = 0;
          let refreshedUser = null;
          
          while (retryCount < 3) {
            const { data: { session }, error: refreshSessionError } = await supabase.auth.refreshSession();
            
            if (refreshSessionError) {
              console.warn(`⚠️ セッションリフレッシュエラー（試行 ${retryCount + 1}/3）:`, refreshSessionError);
            }
            
            // 再度ユーザー情報を取得
            const { data: { user }, error: refreshError } = await supabase.auth.getUser();
            
            if (!refreshError && user) {
              refreshedUser = user;
              console.log('✅ Webhookで既に更新済み（セッションリフレッシュ後）:', {
                userId: user.id,
                membershipType: user.user_metadata?.membership_type,
                subscriptionExpiresAt: user.user_metadata?.subscription_expires_at,
              });
              break;
            } else {
              console.log(`⏳ ユーザー情報の取得を再試行中（試行 ${retryCount + 1}/3）...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            retryCount++;
          }
          
          if (!refreshedUser) {
            console.log('✅ Webhookで既に更新済み（フォールバック）:', {
              userId: updatedUser.id,
              membershipType: currentMembershipType,
              subscriptionExpiresAt: updatedUser.user_metadata?.subscription_expires_at,
            });
          }
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
        onClick={async () => {
          // ホームに戻る前にセッションをリフレッシュ
          const supabase = createClient();
          await supabase.auth.refreshSession();
          // ページをリロードして確実に最新のuser_metadataを取得
          window.location.href = '/?refresh=true';
        }}
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

