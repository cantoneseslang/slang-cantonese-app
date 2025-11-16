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
  let plan: string | undefined;
  let currency: string | undefined;
  
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
    plan = body.plan;
    currency = body.currency || 'jpy';
    const userId = body.userId;
    const couponCode = body.couponCode;

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

    // Supabaseから価格設定を取得
    const selectedCurrency = (currency === 'hkd' ? 'hkd' : 'jpy') as 'jpy' | 'hkd';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { data: pricingConfig, error: pricingError } = await supabase
      .from('stripe_pricing_config')
      .select('stripe_price_id, unit_amount, display_price')
      .eq('plan_type', plan)
      .eq('currency', selectedCurrency)
      .eq('is_active', true)
      .single();

    if (pricingError || !pricingConfig) {
      console.error('Failed to fetch pricing config:', pricingError);
      return NextResponse.json(
        { error: 'Pricing configuration not found', details: pricingError?.message },
        { status: 500 }
      );
    }

    const priceId = pricingConfig.stripe_price_id;
    const unitAmount = pricingConfig.unit_amount;
    
    // 成功時のリダイレクトURLとキャンセル時のリダイレクトURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment/cancel`;

    // テストモードの場合は動的に価格を作成（価格IDが存在しない可能性があるため）
    // 本番モードの場合は価格IDを使用
    const useDynamicPricing = isTestMode || !priceId;

    // Stripe Checkoutセッションを作成
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: useDynamicPricing
        ? [
            // 動的に価格を作成（テストモードまたは価格IDが存在しない場合）
            {
              price_data: {
                currency: selectedCurrency,
                product_data: {
                  name: plan === 'subscription' ? 'シルバー会員（月額）' : 'ゴールド会員（年間一括割引）',
                  description: plan === 'subscription' 
                    ? '月額サブスクリプション（自動更新）' 
                    : '年額サブスクリプション（自動更新）',
                },
                unit_amount: unitAmount, // Supabaseから取得した金額
                recurring: plan === 'subscription' 
                  ? { interval: 'month' } 
                  : { interval: 'year' },
              },
              quantity: 1,
            },
          ]
        : [
            // 既存の価格IDを使用（本番モード）
            {
              price: priceId!,
              quantity: 1,
            },
          ],
      mode: 'subscription', // 両プランともサブスクリプション（月額または年額）
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan: plan,
      },
      // クーポンコードがある場合は適用
      discounts: couponCode ? [{ coupon: couponCode }] : undefined,
      // Stripe Checkoutページでプロモーションコード入力欄を表示
      allow_promotion_codes: true,
      subscription_data: plan === 'subscription' ? {
        metadata: {
          user_id: userId,
          plan: plan,
        },
      } : undefined,
      // lifetimeプランの場合、payment_intentのmetadataにもuser_idとplanを設定
      // また、checkout_session_idも設定して、payment_intent.succeededイベントでセッションを取得できるようにする
      payment_intent_data: plan === 'lifetime' ? {
        metadata: {
          user_id: userId,
          plan: plan,
          checkout_session_id: 'PLACEHOLDER', // セッション作成後に更新する必要があるが、Stripeでは後から更新できないため、セッションIDを後で設定する
        },
      } : undefined,
      customer_email: body.email || undefined,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // lifetimeプランの場合、payment_intentのmetadataにcheckout_session_idを設定するため、
    // セッション作成後にpayment_intentを取得して更新を試みる
    // ただし、Stripeではpayment_intentのmetadataは後から更新できないため、
    // この処理はスキップ（代わりにpayment_intent.succeededイベントでセッションを取得する）

    console.log('✅ Checkout Session created:', {
      sessionId: session.id,
      mode: session.mode,
      plan: plan,
      userId: userId,
      metadata: session.metadata
    });

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

