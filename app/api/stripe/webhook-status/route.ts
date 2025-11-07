import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET(request: NextRequest) {
  try {
    // 最近のWebhookイベントを取得（最大10件）
    const events = await stripe.events.list({
      limit: 10,
      types: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'],
    });

    // 最近のCheckoutセッションを取得
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      recentEvents: events.data.map(event => ({
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode,
      })),
      recentSessions: sessions.data.map(session => ({
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        metadata: session.metadata,
        created: new Date(session.created * 1000).toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Webhook status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook status', details: error.message },
      { status: 500 }
    );
  }
}

