import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  console.log('🔔 Webhook received:', {
    hasSignature: !!signature,
    hasWebhookSecret: !!webhookSecret,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  });

  if (!signature) {
    console.error('❌ No signature provided');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    // Webhookイベントを検証
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('✅ Webhook event verified:', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    });

    // Payment Intent成功時の処理（lifetimeプランの場合、checkout.session.completedが発火しない可能性があるため）
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      let userId = paymentIntent.metadata?.user_id;
      let plan = paymentIntent.metadata?.plan as 'subscription' | 'lifetime';
      
      console.log('🔔 payment_intent.succeeded event received:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        userId,
        plan,
        metadata: paymentIntent.metadata
      });

      // payment_intentのmetadataにuser_idとplanがない場合、checkout_session_idから取得を試みる
      if ((!userId || !plan) && paymentIntent.metadata?.checkout_session_id) {
        try {
          const checkoutSessionId = paymentIntent.metadata.checkout_session_id;
          console.log('📋 checkout_session_idからセッション情報を取得:', checkoutSessionId);
          
          const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
          userId = session.metadata?.user_id || userId;
          plan = (session.metadata?.plan as 'subscription' | 'lifetime') || plan;
          
          console.log('✅ セッションから取得した情報:', { userId, plan });
        } catch (error: any) {
          console.error('❌ セッション取得エラー:', error);
        }
      }

      // payment_intentのmetadataにuser_idとplanがある場合は直接処理
      if (userId && plan) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        // 現在の会員種別を取得（lifetime会員のダウングレードを防止するため）
        const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userId);
        const currentMembershipType = currentUser?.user_metadata?.membership_type || currentUser?.app_metadata?.membership_type;
        
        // ゴールド会員（lifetime）は永久会員のため、ダウングレードを防止
        if (currentMembershipType === 'lifetime' && plan !== 'lifetime') {
          console.log('⚠️ ゴールド会員のダウングレードを防止（payment_intent）:', {
            userId,
            currentMembershipType,
            attemptedPlan: plan
          });
          return NextResponse.json({ 
            received: true, 
            message: 'Lifetime member downgrade prevented',
            timestamp: new Date().toISOString() 
          });
        }
        
        const updateData: any = { membership_type: plan };
        let expiresAt: string | null = null;

        if (plan === 'subscription') {
          const expiresDate = new Date();
          expiresDate.setMonth(expiresDate.getMonth() + 1);
          expiresAt = expiresDate.toISOString();
          updateData.subscription_expires_at = expiresAt;
        } else if (plan === 'lifetime') {
          // ゴールド会員（年間一括割引）: 1年後
          const expiresDate = new Date();
          expiresDate.setFullYear(expiresDate.getFullYear() + 1);
          expiresAt = expiresDate.toISOString();
          updateData.subscription_expires_at = expiresAt;
        }

        console.log('📝 Updating user membership from payment_intent:', {
          userId,
          plan,
          expiresAt,
          updateData,
          isLifetime: plan === 'lifetime',
          currentMembershipType
        });

        // 1. user_metadataを更新（サブスクリプションIDとカスタマーIDも保存）
        updateData.stripe_subscription_id = session.subscription;
        updateData.stripe_customer_id = session.customer;
        
        const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
          userId,
          { user_metadata: updateData }
        );

        if (userError) {
          console.error('❌ Failed to update user metadata from payment_intent:', userError);
        } else {
          console.log('✅ User metadata updated successfully from payment_intent:', {
            userId: userData?.user?.id,
            membershipType: userData?.user?.user_metadata?.membership_type
          });
        }

        // 2. usersテーブルも確実に更新
        const { data: dbData, error: dbError } = await supabase
          .from('users')
          .update({
            membership_type: plan,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select();

        if (dbError) {
          if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
            console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました（payment_intent）:', {
              userId,
              plan,
              error: dbError.message
            });
          } else {
            console.error('❌ Failed to update users table from payment_intent:', dbError);
          }
        } else {
          console.log('✅ Users table updated successfully from payment_intent:', {
            userId,
            updatedRows: dbData?.length || 0,
            data: dbData
          });
        }
      } else {
        console.log('⚠️ payment_intent.succeeded: metadataにuser_idまたはplanが含まれていません:', {
          userId,
          plan,
          metadata: paymentIntent.metadata
        });
        
        // セッションIDがない場合でも、payment_intentから直接セッションを検索する
        // これは最後の手段として使用
        if (!userId || !plan) {
          console.log('🔄 payment_intentから直接セッションを検索します...');
          try {
            // 最近のセッションを検索（最大50件）
            const sessions = await stripe.checkout.sessions.list({
              limit: 50,
            });
            
            // payment_intent.idに一致するセッションを検索
            const foundSession = sessions.data.find(s => {
              // セッションのpayment_intentを取得
              if (s.payment_intent && typeof s.payment_intent === 'string') {
                return s.payment_intent === paymentIntent.id;
              }
              return false;
            });
            
            if (foundSession) {
              userId = foundSession.metadata?.user_id || userId;
              plan = (foundSession.metadata?.plan as 'subscription' | 'lifetime') || plan;
              
              console.log('✅ セッション検索で見つかりました:', { 
                sessionId: foundSession.id,
                userId, 
                plan,
                paymentIntentId: paymentIntent.id
              });
              
              // 見つかった場合は処理を続行
              if (userId && plan) {
                const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
                
                // 現在の会員種別を取得（lifetime会員のダウングレードを防止するため）
                const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userId);
                const currentMembershipType = currentUser?.user_metadata?.membership_type || currentUser?.app_metadata?.membership_type;
                
                // ゴールド会員（lifetime）は永久会員のため、ダウングレードを防止
                if (currentMembershipType === 'lifetime' && plan !== 'lifetime') {
                  console.log('⚠️ ゴールド会員のダウングレードを防止（payment_intent session search）:', {
                    userId,
                    currentMembershipType,
                    attemptedPlan: plan
                  });
                  return NextResponse.json({ 
                    received: true, 
                    message: 'Lifetime member downgrade prevented',
                    timestamp: new Date().toISOString() 
                  });
                }
                
                const updateData: any = { membership_type: plan };
                let expiresAt: string | null = null;

                if (plan === 'subscription') {
                  const expiresDate = new Date();
                  expiresDate.setMonth(expiresDate.getMonth() + 1);
                  expiresAt = expiresDate.toISOString();
                  updateData.subscription_expires_at = expiresAt;
                } else if (plan === 'lifetime') {
                  // ゴールド会員（年間一括割引）: 1年後
                  const expiresDate = new Date();
                  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
                  expiresAt = expiresDate.toISOString();
                  updateData.subscription_expires_at = expiresAt;
                }

                console.log('📝 Updating user membership from payment_intent (found via session search):', {
                  userId,
                  plan,
                  expiresAt,
                  updateData,
                  currentMembershipType
                });

                const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
                  userId,
                  { user_metadata: updateData }
                );

                if (userError) {
                  console.error('❌ Failed to update user metadata from payment_intent (session search):', userError);
                } else {
                  console.log('✅ User metadata updated successfully from payment_intent (session search):', {
                    userId: userData?.user?.id,
                    membershipType: userData?.user?.user_metadata?.membership_type
                  });
                }

                const { data: dbData, error: dbError } = await supabase
                  .from('users')
                  .update({
                    membership_type: plan,
                    subscription_expires_at: expiresAt,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId)
                  .select();

                if (dbError) {
                  if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
                    console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました（session search）');
                  } else {
                    console.error('❌ Failed to update users table from payment_intent (session search):', dbError);
                  }
                } else {
                  console.log('✅ Users table updated successfully from payment_intent (session search):', {
                    userId,
                    updatedRows: dbData?.length || 0
                  });
                }
              }
            } else {
              console.log('⚠️ payment_intentに対応するセッションが見つかりませんでした:', {
                paymentIntentId: paymentIntent.id,
                searchedSessions: sessions.data.length
              });
            }
          } catch (searchError: any) {
            console.error('❌ セッション検索エラー:', searchError);
          }
        }
      }
    }

    // Checkoutセッション完了時の処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as 'subscription' | 'lifetime';

      console.log('🔔 checkout.session.completed event received:', {
        sessionId: session.id,
        userId,
        plan,
        mode: session.mode,
        payment_status: session.payment_status,
        status: session.status,
        metadata: session.metadata
      });

      // lifetimeプラン（mode: 'payment'）の場合も確実に処理する
      // payment_intent.succeededで処理されなかった場合に備えて、checkout.session.completedでも処理
      if (session.mode === 'payment' && plan === 'lifetime') {
        console.log('🔔 checkout.session.completed: lifetimeプラン（payment mode）を処理します');
      }

      if (!userId || !plan) {
        console.error('❌ Missing metadata:', { userId, plan, sessionMetadata: session.metadata });
        return NextResponse.json(
          { error: 'Missing metadata', details: { userId, plan } },
          { status: 400 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      // 現在の会員種別を取得（lifetime会員のダウングレードを防止するため）
      const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userId);
      const currentMembershipType = currentUser?.user_metadata?.membership_type || currentUser?.app_metadata?.membership_type;
      
      // ゴールド会員（lifetime）は永久会員のため、ダウングレードを防止
      if (currentMembershipType === 'lifetime' && plan !== 'lifetime') {
        console.log('⚠️ ゴールド会員のダウングレードを防止（checkout.session.completed）:', {
          userId,
          currentMembershipType,
          attemptedPlan: plan,
          sessionId: session.id
        });
        return NextResponse.json({ 
          received: true, 
          message: 'Lifetime member downgrade prevented',
          timestamp: new Date().toISOString() 
        });
      }

      // ユーザーの会員種別を更新
      const updateData: any = {
        membership_type: plan,
      };

      // サブスクリプションの場合は有効期限を設定、lifetimeの場合はnullに設定
      let expiresAt: string | null = null;
      if (plan === 'subscription') {
        const expiresDate = new Date();
        expiresDate.setMonth(expiresDate.getMonth() + 1);
        expiresAt = expiresDate.toISOString();
        updateData.subscription_expires_at = expiresAt;
      } else if (plan === 'lifetime') {
        // ゴールド会員（年間一括割引）: 1年後
        const expiresDate = new Date();
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
        expiresAt = expiresDate.toISOString();
        updateData.subscription_expires_at = expiresAt;
      }

      console.log('📝 Updating user membership:', {
        userId,
        plan,
        expiresAt,
        updateData,
        isLifetime: plan === 'lifetime',
        isSubscription: plan === 'subscription'
      });

      // 1. user_metadataを更新（サブスクリプションIDとカスタマーIDも保存）
      updateData.stripe_subscription_id = session.subscription;
      updateData.stripe_customer_id = session.customer;
      
      const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: updateData
        }
      );

      if (userError) {
        console.error('❌ Failed to update user metadata:', userError);
      } else {
        console.log('✅ User metadata updated successfully:', {
          userId: userData?.user?.id,
          membershipType: userData?.user?.user_metadata?.membership_type
        });
      }

      // 2. usersテーブルも確実に更新（user_metadataの更新が成功しても失敗しても実行）
      // usersテーブルが存在しない場合はスキップ（エラーを無視）
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .update({
          membership_type: plan,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (dbError) {
        // usersテーブルが存在しない場合は警告のみ（user_metadataは更新済み）
        if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
          console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました:', {
            userId,
            plan,
            error: dbError.message
          });
        } else {
          console.error('❌ Failed to update users table:', dbError);
        }
      } else {
        console.log('✅ Users table updated successfully:', {
          userId,
          updatedRows: dbData?.length || 0,
          data: dbData
        });
      }

      // user_metadataの更新が失敗した場合はエラーを返す
      if (userError) {
        console.error('❌ Failed to update user_metadata - this is critical:', userError);
        return NextResponse.json(
          { 
            error: 'Failed to update user membership', 
            details: { userError: userError.message, userId, plan }
          },
          { status: 500 }
        );
      }
    }

    // サブスクリプション更新時の処理
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const subscriptionAny = subscription as any;

      console.log('🔔 customer.subscription.updated event received:', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status,
        canceledAt: subscriptionAny.canceled_at,
        currentPeriodEnd: subscriptionAny.current_period_end,
        metadata: subscription.metadata
      });

      if (userId) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // キャンセルされた場合の処理
        if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'past_due') {
          console.log('⚠️ Subscription canceled/unpaid/past_due:', {
            subscriptionId: subscription.id,
            userId,
            status: subscription.status
          });

          // 現在の期間終了日を有効期限として設定（その後はブロンズにダウングレード）
          const expiresAt = subscriptionAny.current_period_end
            ? new Date(subscriptionAny.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後

          console.log('📝 Setting subscription expiration date:', {
            userId,
            expiresAt: expiresAt.toISOString()
          });

          // 1. user_metadataを更新
          const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              membership_type: 'subscription',
              subscription_expires_at: expiresAt.toISOString()
            }
          });

          if (userError) {
            console.error('❌ Failed to update user metadata (subscription canceled):', userError);
          } else {
            console.log('✅ User metadata updated (subscription canceled):', {
              userId: userData?.user?.id,
              expiresAt: expiresAt.toISOString()
            });
          }

          // 2. usersテーブルも更新
          const { data: dbData, error: dbError } = await supabase
            .from('users')
            .update({
              membership_type: 'subscription',
              subscription_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

          if (dbError) {
            if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
              console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました（subscription canceled）');
            } else {
              console.error('❌ Failed to update users table (subscription canceled):', dbError);
            }
          } else {
            console.log('✅ Users table updated (subscription canceled):', {
              userId,
              updatedRows: dbData?.length || 0
            });
          }
        } else if (subscription.status === 'active') {
          // アクティブな場合、次の請求日の1ヶ月後を有効期限として設定
          const currentPeriodEnd = subscriptionAny.current_period_end 
            ? new Date(subscriptionAny.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後
          const expiresAt = new Date(currentPeriodEnd);
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              membership_type: 'subscription',
              subscription_expires_at: expiresAt.toISOString()
            }
          });

          if (userError) {
            console.error('❌ Failed to update user metadata (subscription active):', userError);
          } else {
            console.log('✅ User metadata updated (subscription active):', {
              userId: userData?.user?.id,
              expiresAt: expiresAt.toISOString()
            });
          }
        }
      }
    }

    // サブスクリプションキャンセル時の処理
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const subscriptionAny = subscription as any;

      console.log('🔔 customer.subscription.deleted event received:', {
        subscriptionId: subscription.id,
        userId,
        status: subscription.status,
        currentPeriodEnd: subscriptionAny.current_period_end,
        metadata: subscription.metadata
      });

      if (userId) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        // 現在の期間終了日を有効期限として設定（その後はブロンズにダウングレード）
        const expiresAt = subscriptionAny.current_period_end
          ? new Date(subscriptionAny.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後

        console.log('📝 Setting subscription expiration date (deleted):', {
          userId,
          expiresAt: expiresAt.toISOString()
        });

        // 1. user_metadataを更新
        const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            membership_type: 'subscription',
            subscription_expires_at: expiresAt.toISOString()
          }
        });

        if (userError) {
          console.error('❌ Failed to update user metadata (subscription deleted):', userError);
        } else {
          console.log('✅ User metadata updated (subscription deleted):', {
            userId: userData?.user?.id,
            expiresAt: expiresAt.toISOString()
          });
        }

        // 2. usersテーブルも更新
        const { data: dbData, error: dbError } = await supabase
          .from('users')
          .update({
            membership_type: 'subscription',
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select();

        if (dbError) {
          if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
            console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました（subscription deleted）');
          } else {
            console.error('❌ Failed to update users table (subscription deleted):', dbError);
          }
        } else {
          console.log('✅ Users table updated (subscription deleted):', {
            userId,
            updatedRows: dbData?.length || 0
          });
        }
      }
    }

    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', {
      message: error.message,
      type: error.type,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // シグネチャ検証エラーの場合は詳細をログに記録
    if (error.type === 'StripeSignatureVerificationError') {
      console.error('❌ Signature verification failed:', {
        message: error.message,
        header: signature?.substring(0, 20) + '...',
        webhookSecretExists: !!webhookSecret,
        webhookSecretLength: webhookSecret?.length || 0
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Webhook error', 
        details: error.message,
        type: error.type
      },
      { status: 400 }
    );
  }
}

