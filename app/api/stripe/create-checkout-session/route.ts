import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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

    // プランの価格設定（JPY）
    const priceMap: Record<string, { amount: number; currency: string; name: string }> = {
      subscription: {
        amount: 980, // ¥980/月
        currency: 'jpy',
        name: 'シルバー会員（月額）'
      },
      lifetime: {
        amount: 9800, // ¥9,800
        currency: 'jpy',
        name: 'ゴールド会員（買い切り）'
      }
    };

    const priceConfig = priceMap[plan];
    if (!priceConfig) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // 成功時のリダイレクトURLとキャンセル時のリダイレクトURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // Stripe Checkoutセッションを作成
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: priceConfig.currency,
            product_data: {
              name: priceConfig.name,
              description: plan === 'subscription' 
                ? '月額サブスクリプション（自動更新）' 
                : '買い切りプラン（永久使用）',
            },
            unit_amount: priceConfig.amount,
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

