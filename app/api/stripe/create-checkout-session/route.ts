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

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // 既存のサブスクリプションとカスタマーIDを確認
    const { data: { user: existingUser } } = await supabase.auth.admin.getUserById(userId);
    let existingSubscriptionId = existingUser?.user_metadata?.stripe_subscription_id;
    let customerId = existingUser?.user_metadata?.stripe_customer_id;

    console.log('💳 既存サブスクリプション確認:', {
      userId,
      existingSubscriptionId,
      existingCustomerId: customerId,
      requestedPlan: plan
    });

    // user_metadataにサブスクリプションIDがない場合、カスタマーIDから検索
    if (!existingSubscriptionId && customerId) {
      try {
        console.log('🔍 カスタマーIDからアクティブなサブスクリプションを検索:', customerId);
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const activeSubscription = subscriptions.data[0];
          existingSubscriptionId = activeSubscription.id;
          
          console.log('✅ カスタマーIDからアクティブなサブスクリプションを発見:', {
            subscriptionId: existingSubscriptionId,
            status: activeSubscription.status
          });

          // user_metadataに保存して、次回から確実に検出できるようにする
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...existingUser?.user_metadata,
              stripe_subscription_id: existingSubscriptionId,
              stripe_customer_id: customerId
            }
          });
        }
      } catch (err: any) {
        console.log('ℹ️ カスタマーIDからのサブスクリプション検索に失敗:', err.message);
      }
    }

    // 既存のサブスクリプションがある場合、プラン変更を処理
    if (existingSubscriptionId) {
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          console.log('🔄 既存のアクティブなサブスクリプションを更新します:', {
            subscriptionId: existingSubscriptionId,
            status: existingSubscription.status,
            requestedPlan: plan
          });

          // 既存のサブスクリプションの現在のプランを確認
          const currentPriceId = existingSubscription.items.data[0]?.price.id;
          
          // Supabaseから価格設定を取得
          const selectedCurrency = (currency === 'hkd' ? 'hkd' : 'jpy') as 'jpy' | 'hkd';
          
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

          const newPriceId = pricingConfig.stripe_price_id;

          // 同じプランの場合はエラーを返す
          if (currentPriceId === newPriceId) {
            return NextResponse.json(
              { 
                error: 'Same plan already active', 
                details: '既に同じプランが有効です。',
                subscriptionId: existingSubscriptionId
              },
              { status: 400 }
            );
          }

          // サブスクリプションを更新（プラン変更）
          const updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
            items: [{
              id: existingSubscription.items.data[0].id,
              price: newPriceId || undefined,
            }],
            metadata: {
              user_id: userId,
              plan: plan,
            },
            proration_behavior: 'always_invoice', // 即座に請求（比例配分）
          });

          console.log('✅ サブスクリプションを更新しました:', {
            subscriptionId: updatedSubscription.id,
            oldPriceId: currentPriceId,
            newPriceId: newPriceId,
            plan: plan
          });

          // 更新されたサブスクリプションの情報を返す
          return NextResponse.json({
            success: true,
            subscriptionId: updatedSubscription.id,
            message: 'サブスクリプションを更新しました。',
            updated: true
          });
        }
      } catch (err: any) {
        console.log('ℹ️ 既存サブスクリプションの更新に失敗。新規作成します。', err.message);
        // エラーが発生した場合は新規作成を続行
      }
    }

    // 既存の顧客IDがない場合、メールアドレスで検索
    if (!customerId && body.email) {
      try {
        const customers = await stripe.customers.list({
          email: body.email,
          limit: 1
        });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('✅ 既存の顧客を発見:', { customerId, email: body.email });
          
          // このカスタマーのアクティブなサブスクリプションも検索
          if (!existingSubscriptionId) {
            try {
              console.log('🔍 メールアドレスから発見したカスタマーのアクティブなサブスクリプションを検索:', customerId);
              const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1,
              });

              if (subscriptions.data.length > 0) {
                const activeSubscription = subscriptions.data[0];
                existingSubscriptionId = activeSubscription.id;
                
                console.log('✅ メールアドレスから発見したカスタマーのアクティブなサブスクリプションを発見:', {
                  subscriptionId: existingSubscriptionId,
                  status: activeSubscription.status
                });
              }
            } catch (err: any) {
              console.log('ℹ️ カスタマーのサブスクリプション検索に失敗:', err.message);
            }
          }
          
          // 顧客IDとサブスクリプションIDをuser_metadataに保存
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...existingUser?.user_metadata,
              stripe_customer_id: customerId,
              ...(existingSubscriptionId && { stripe_subscription_id: existingSubscriptionId })
            }
          });

          // サブスクリプションが見つかった場合、プラン変更処理を実行
          if (existingSubscriptionId) {
            try {
              const foundSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);
              if (foundSubscription.status === 'active' || foundSubscription.status === 'trialing') {
                console.log('🔄 メールアドレスから発見したアクティブなサブスクリプションを更新します:', {
                  subscriptionId: existingSubscriptionId,
                  status: foundSubscription.status,
                  requestedPlan: plan
                });

                // 既存のサブスクリプションの現在のプランを確認
                const currentPriceId = foundSubscription.items.data[0]?.price.id;
                
                // Supabaseから価格設定を取得
                const selectedCurrency = (currency === 'hkd' ? 'hkd' : 'jpy') as 'jpy' | 'hkd';
                
                const { data: pricingConfig, error: pricingError } = await supabase
                  .from('stripe_pricing_config')
                  .select('stripe_price_id, unit_amount, display_price')
                  .eq('plan_type', plan)
                  .eq('currency', selectedCurrency)
                  .eq('is_active', true)
                  .single();

                if (pricingError || !pricingConfig) {
                  console.error('Failed to fetch pricing config:', pricingError);
                  // エラーが発生した場合は新規作成を続行
                } else {
                  const newPriceId = pricingConfig.stripe_price_id;

                  // 同じプランの場合はエラーを返す
                  if (currentPriceId === newPriceId) {
                    return NextResponse.json(
                      { 
                        error: 'Same plan already active', 
                        details: '既に同じプランが有効です。',
                        subscriptionId: existingSubscriptionId
                      },
                      { status: 400 }
                    );
                  }

                  // サブスクリプションを更新（プラン変更）
                  const updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
                    items: [{
                      id: foundSubscription.items.data[0].id,
                      price: newPriceId || undefined,
                    }],
                    metadata: {
                      user_id: userId,
                      plan: plan,
                    },
                    proration_behavior: 'always_invoice', // 即座に請求（比例配分）
                  });

                  console.log('✅ サブスクリプションを更新しました（メールアドレスから発見）:', {
                    subscriptionId: updatedSubscription.id,
                    oldPriceId: currentPriceId,
                    newPriceId: newPriceId,
                    plan: plan
                  });

                  // 更新されたサブスクリプションの情報を返す
                  return NextResponse.json({
                    success: true,
                    subscriptionId: updatedSubscription.id,
                    message: 'サブスクリプションを更新しました。',
                    updated: true
                  });
                }
              }
            } catch (err: any) {
              console.log('ℹ️ メールアドレスから発見したサブスクリプションの更新に失敗。新規作成します。', err.message);
              // エラーが発生した場合は新規作成を続行
            }
          }
        }
      } catch (err) {
        console.log('ℹ️ 既存顧客の検索に失敗。新規作成します。', err);
      }
    }

    // Supabaseから価格設定を取得
    const selectedCurrency = (currency === 'hkd' ? 'hkd' : 'jpy') as 'jpy' | 'hkd';
    
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
      subscription_data: {
        metadata: {
          user_id: userId,
          plan: plan,
        },
      },
      // lifetimeプランの場合、payment_intentのmetadataにもuser_idとplanを設定
      // また、checkout_session_idも設定して、payment_intent.succeededイベントでセッションを取得できるようにする
      payment_intent_data: plan === 'lifetime' ? {
        metadata: {
          user_id: userId,
          plan: plan,
          checkout_session_id: 'PLACEHOLDER', // セッション作成後に更新する必要があるが、Stripeでは後から更新できないため、セッションIDを後で設定する
        },
      } : undefined,
      // 既存の顧客IDがあればそれを使用、なければメールアドレスで新規作成
      customer: customerId || undefined,
      customer_email: customerId ? undefined : (body.email || undefined),
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

