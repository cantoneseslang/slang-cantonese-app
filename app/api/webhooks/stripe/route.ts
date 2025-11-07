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

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  try {
    // Webhookイベントを検証
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('Stripe Webhook event:', event.type);

    // Checkoutセッション完了時の処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as 'subscription' | 'lifetime';

      if (!userId || !plan) {
        console.error('Missing metadata:', { userId, plan });
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      // ユーザーの会員種別を更新
      const updateData: any = {
        membership_type: plan,
      };

      // サブスクリプションの場合は有効期限を設定
      if (plan === 'subscription') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        updateData.subscription_expires_at = expiresAt.toISOString();
      }

      // Supabaseのuser_metadataを更新
      const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: updateData
        }
      );

      if (userError) {
        console.error('Failed to update user metadata:', userError);
        // usersテーブルにも更新を試みる
        const { error: dbError } = await supabase
          .from('users')
          .update({
            membership_type: plan,
            subscription_expires_at: plan === 'subscription' ? updateData.subscription_expires_at : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (dbError) {
          console.error('Failed to update users table:', dbError);
        }
      } else {
        console.log('User metadata updated successfully:', userData);
      }
    }

    // サブスクリプション更新時の処理
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;

      if (userId && subscription.status === 'active') {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        
        // 次の請求日の1ヶ月後を有効期限として設定
        const currentPeriodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
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
        const expiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // フォールバック: 30日後

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            membership_type: 'subscription',
            subscription_expires_at: expiresAt.toISOString()
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error', details: error.message },
      { status: 400 }
    );
  }
}

