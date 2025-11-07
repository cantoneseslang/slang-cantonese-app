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
      const userId = paymentIntent.metadata?.user_id;
      const plan = paymentIntent.metadata?.plan as 'subscription' | 'lifetime';
      
      console.log('🔔 payment_intent.succeeded event received:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        userId,
        plan,
        metadata: paymentIntent.metadata
      });

      // payment_intentのmetadataにuser_idとplanがある場合は直接処理
      if (userId && plan) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        const updateData: any = { membership_type: plan };
        let expiresAt: string | null = null;

        if (plan === 'subscription') {
          const expiresDate = new Date();
          expiresDate.setMonth(expiresDate.getMonth() + 1);
          expiresAt = expiresDate.toISOString();
          updateData.subscription_expires_at = expiresAt;
        } else if (plan === 'lifetime') {
          expiresAt = null;
          updateData.subscription_expires_at = null;
        }

        console.log('📝 Updating user membership from payment_intent:', {
          userId,
          plan,
          expiresAt,
          updateData,
          isLifetime: plan === 'lifetime'
        });

        // 1. user_metadataを更新
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
        // lifetimeプランの場合はsubscription_expires_atをnullに設定（期限なし）
        expiresAt = null;
        updateData.subscription_expires_at = null;
      }

      console.log('📝 Updating user membership:', {
        userId,
        plan,
        expiresAt,
        updateData,
        isLifetime: plan === 'lifetime',
        isSubscription: plan === 'subscription'
      });

      // 1. user_metadataを更新
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

      if (userId && subscription.status === 'active') {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        // 次の請求日の1ヶ月後を有効期限として設定
        // current_period_endはStripe.Subscription型に存在するが、型定義の問題でany型にキャスト
        const subscriptionAny = subscription as any;
        const currentPeriodEnd = subscriptionAny.current_period_end 
          ? new Date(subscriptionAny.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後
        const expiresAt = new Date(currentPeriodEnd);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            membership_type: 'subscription',
            subscription_expires_at: expiresAt.toISOString()
          }
        });
      }
    }

    // サブスクリプションキャンセル時の処理
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;

      if (userId) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        // 現在の期間終了日を有効期限として設定（その後はブロンズにダウングレード）
        // current_period_endはStripe.Subscription型に存在するが、型定義の問題でany型にキャスト
        const subscriptionAny = subscription as any;
        const expiresAt = subscriptionAny.current_period_end
          ? new Date(subscriptionAny.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            membership_type: 'subscription',
            subscription_expires_at: expiresAt.toISOString()
          }
        });
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

