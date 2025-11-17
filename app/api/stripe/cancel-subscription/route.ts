import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ビルド時に環境変数が設定されていない場合でもエラーにならないようにする
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
}) : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { subscriptionId, userId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required', details: 'サブスクリプションIDが必要です。' },
        { status: 400 }
      );
    }

    // サブスクリプションの存在確認
    let existingSubscription: Stripe.Subscription;
    try {
      existingSubscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    } catch (retrieveError: any) {
      console.error('❌ Subscription retrieve error:', retrieveError);
      if (retrieveError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Subscription not found', details: 'サブスクリプションが見つかりませんでした。' },
          { status: 404 }
        );
      }
      throw retrieveError;
    }

    // 既にキャンセル済みの場合は、現在の期間終了日を返す
    if (existingSubscription.status === 'canceled' || existingSubscription.cancel_at_period_end) {
      const subscriptionAny = existingSubscription as any;
      const expiresAt = subscriptionAny.current_period_end
        ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // フォールバック: 30日後

      return NextResponse.json({
        success: true,
        expiresAt,
        currentPeriodEnd: subscriptionAny.current_period_end,
        message: '既にキャンセル予約済みです。',
        alreadyCanceled: true
      });
    }

    // サブスクリプションを期間終了時にキャンセル（既に支払った期間は有効）
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    }) as Stripe.Subscription;

    const subscriptionAny = subscription as any;

    console.log('✅ サブスクリプションをキャンセル予約:', {
      subscriptionId,
      userId,
      cancelAt: subscriptionAny.cancel_at,
      currentPeriodEnd: subscriptionAny.current_period_end,
      status: subscription.status
    });

    // 期間終了日を返す
    const expiresAt = subscriptionAny.current_period_end
      ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // フォールバック: 30日後

    // 注: membershipTypeは変更しない
    // 期間終了時にwebhook (customer.subscription.deleted) で自動的にブロンズへ変更される

    return NextResponse.json({
      success: true,
      expiresAt,
      currentPeriodEnd: subscriptionAny.current_period_end,
      message: '期間終了時にキャンセルされます。それまでは現在のプランをご利用いただけます。'
    });
  } catch (error: any) {
    console.error('❌ Subscription cancel error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    
    // より詳細なエラーメッセージを返す
    let errorMessage = 'サブスクリプションのキャンセルに失敗しました';
    let statusCode = 500;

    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_missing') {
        errorMessage = 'サブスクリプションが見つかりませんでした。';
        statusCode = 404;
      } else {
        errorMessage = `Stripeエラー: ${error.message}`;
        statusCode = 400;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription', 
        details: errorMessage,
        errorType: error.type,
        errorCode: error.code
      },
      { status: statusCode }
    );
  }
}

