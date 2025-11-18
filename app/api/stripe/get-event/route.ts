import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ビルド時に環境変数が設定されていない場合でもエラーにならないようにする
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
}) : null;

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // イベントの詳細を取得
    const event = await stripe.events.retrieve(eventId, {
      expand: ['data.object']
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode,
        api_version: event.api_version,
        data: {
          object: event.data.object,
          previous_attributes: (event.data as any).previous_attributes,
        },
        request: event.request,
      },
    });
  } catch (error: any) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve event', 
        details: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: error.statusCode || 500 }
    );
  }
}

