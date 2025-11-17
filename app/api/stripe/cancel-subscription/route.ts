import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, userId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
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
    const expiresAt = new Date(subscriptionAny.current_period_end * 1000).toISOString();

    // 注: membershipTypeは変更しない
    // 期間終了時にwebhook (customer.subscription.deleted) で自動的にブロンズへ変更される

    return NextResponse.json({
      success: true,
      expiresAt,
      currentPeriodEnd: subscriptionAny.current_period_end,
      message: '期間終了時にキャンセルされます。それまでは現在のプランをご利用いただけます。'
    });
  } catch (error: any) {
    console.error('❌ Subscription cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}

