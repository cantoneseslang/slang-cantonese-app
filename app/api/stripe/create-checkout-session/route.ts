import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, userId } = body;

    if (!plan || !userId) {
      return NextResponse.json(
        { error: 'Plan and userId are required' },
        { status: 400 }
      );
    }

    // プランが無料の場合は処理しない
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    // プランの価格ID設定（Stripeで作成済みの価格IDを使用）
    // 環境変数で設定するか、直接指定する
    const priceIdMap: Record<string, string> = {
      subscription: process.env.STRIPE_PRICE_ID_SUBSCRIPTION || '', // シルバー会員（月額）の価格ID
      lifetime: process.env.STRIPE_PRICE_ID_LIFETIME || '', // ゴールド会員（買い切り）の価格ID
    };

    // 既存の価格IDが設定されている場合はそれを使用、なければ動的に作成
    const priceId = priceIdMap[plan];
    
    // 成功時のリダイレクトURLとキャンセル時のリダイレクトURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Stripe Checkoutセッションを作成
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: priceId 
        ? [
            // 既存の価格IDを使用
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            // 動的に価格を作成（フォールバック）
            {
              price_data: {
                currency: plan === 'subscription' ? 'jpy' : 'jpy',
                product_data: {
                  name: plan === 'subscription' ? 'シルバー会員（月額）' : 'ゴールド会員（買い切り）',
                  description: plan === 'subscription' 
                    ? '月額サブスクリプション（自動更新）' 
                    : '買い切りプラン（永久使用）',
                },
                unit_amount: plan === 'subscription' ? 980 : 9800,
                ...(plan === 'subscription' && {
                  recurring: {
                    interval: 'month',
                  },
                }),
              },
              quantity: 1,
            },
          ],
      mode: plan === 'subscription' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan: plan,
      },
      subscription_data: plan === 'subscription' ? {
        metadata: {
          user_id: userId,
          plan: plan,
        },
      } : undefined,
      customer_email: body.email || undefined,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}

