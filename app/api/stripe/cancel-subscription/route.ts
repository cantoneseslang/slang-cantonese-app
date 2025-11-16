import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // サブスクリプションを期間終了時にキャンセル
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log('✅ サブスクリプションをキャンセル予約:', {
      subscriptionId,
      cancelAt: subscription.cancel_at,
      currentPeriodEnd: subscription.current_period_end,
    });

    // 期間終了日を返す
    const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

    return NextResponse.json({
      success: true,
      expiresAt,
      message: '期間終了時にキャンセルされます'
    });
  } catch (error: any) {
    console.error('❌ Subscription cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}

