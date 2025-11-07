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

    // 各セッションの詳細情報を取得（metadataを含む）
    const sessionsWithDetails = await Promise.all(
      sessions.data.map(async (session) => {
        try {
          const fullSession = await stripe.checkout.sessions.retrieve(session.id);
          return {
            id: fullSession.id,
            payment_status: fullSession.payment_status,
            status: fullSession.status,
            metadata: fullSession.metadata,
            customer: fullSession.customer,
            customer_email: fullSession.customer_details?.email,
            subscription: fullSession.subscription,
            created: new Date(fullSession.created * 1000).toISOString(),
            amount_total: fullSession.amount_total,
            currency: fullSession.currency,
          };
        } catch (error: any) {
          return {
            id: session.id,
            error: error.message,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      recentEvents: events.data.map(event => ({
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode,
        data: event.type === 'checkout.session.completed' ? {
          sessionId: (event.data.object as any).id,
          metadata: (event.data.object as any).metadata,
        } : undefined,
      })),
      recentSessions: sessionsWithDetails,
      webhookEndpoint: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Not configured',
    });
  } catch (error: any) {
    console.error('Webhook status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook status', details: error.message },
      { status: 500 }
    );
  }
}


