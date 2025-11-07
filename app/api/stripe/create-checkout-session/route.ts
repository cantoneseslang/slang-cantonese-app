import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Stripeがテストモードかどうかを判定（APIキーがsk_test_で始まる場合はテストモード）
const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;

export async function POST(request: NextRequest) {
  try {
    // 環境変数の確認
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe configuration error', details: 'STRIPE_SECRET_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { plan, userId, currency = 'jpy' } = body; // 通貨を取得（デフォルト: JPY）

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
    // 通貨に応じて適切な価格IDを選択
    const selectedCurrency = currency === 'hkd' ? 'hkd' : 'jpy';
    const priceIdMap: Record<string, Record<string, string>> = {
      subscription: {
        jpy: process.env.STRIPE_PRICE_ID_SUBSCRIPTION_JPY || 'price_1SQildLopXhymmb3EAPe789Q', // シルバー会員（月額）- JPY
        hkd: process.env.STRIPE_PRICE_ID_SUBSCRIPTION_HKD || 'price_1SQildLopXhymmb3EAPe789Q', // シルバー会員（月額）- HKD（同じ価格IDを使用）
      },
      lifetime: {
        jpy: process.env.STRIPE_PRICE_ID_LIFETIME_JPY || 'price_1SQiVQLopXhymmb32pf7GnDc', // ゴールド会員（買い切り）- JPY
        hkd: process.env.STRIPE_PRICE_ID_LIFETIME_HKD || 'price_1SQiS1LopXhymmb3dZDWJV73', // ゴールド会員（買い切り）- HKD
      },
    };

    // 選択された通貨に応じて価格IDを取得
    const priceId = priceIdMap[plan]?.[selectedCurrency];
    
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
                currency: selectedCurrency,
                product_data: {
                  name: plan === 'subscription' ? 'シルバー会員（月額）' : 'ゴールド会員（買い切り）',
                  description: plan === 'subscription' 
                    ? '月額サブスクリプション（自動更新）' 
                    : '買い切りプラン（永久使用）',
                },
                unit_amount: plan === 'subscription' 
                  ? (selectedCurrency === 'hkd' ? 50 : 980) // HKD: $50, JPY: ¥980
                  : (selectedCurrency === 'hkd' ? 49800 : 9800), // HKD: $498, JPY: ¥9,800
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
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw,
    });
    
    // より詳細なエラー情報を返す
    const errorDetails = {
      message: error.message || 'Unknown error',
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    };

    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        details: error.message,
        errorInfo: errorDetails,
        debug: {
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
          isTestMode: isTestMode,
          plan: plan,
          currency: currency,
        }
      },
      { status: 500 }
    );
  }
}

