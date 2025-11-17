import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  // 1. Stripe接続確認
  try {
    const account = await stripe.accounts.retrieve();
    checks.services.stripe = {
      connected: true,
      accountId: account.id,
      email: account.email,
      apiVersion: '2025-10-29.clover',
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
    };
  } catch (error: any) {
    checks.services.stripe = {
      connected: false,
      error: error.message,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    };
  }

  // 2. Supabase接続確認
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    checks.services.supabase = {
      connected: true,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set',
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      serviceRoleKeyLength: supabaseServiceRoleKey?.length || 0,
      canQuery: !error,
      queryError: error?.message || null,
    };
  } catch (error: any) {
    checks.services.supabase = {
      connected: false,
      error: error.message,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
    };
  }

  // 3. Webhookエンドポイント確認
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
    : 'Not configured';
  
  checks.services.webhook = {
    endpoint: webhookUrl,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    expectedEvents: [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
  };

  // 4. 最近のWebhookイベント確認（Stripeから）
  try {
    const events = await stripe.events.list({
      limit: 5,
      types: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'],
    });
    
    checks.services.stripe.recentEvents = events.data.map(event => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode,
    }));
  } catch (error: any) {
    checks.services.stripe.recentEventsError = error.message;
  }

  // 5. 最近のサブスクリプション確認
  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 5,
      status: 'all',
    });
    
    checks.services.stripe.recentSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      created: new Date(sub.created * 1000).toISOString(),
      metadata: sub.metadata,
    }));
  } catch (error: any) {
    checks.services.stripe.recentSubscriptionsError = error.message;
  }

  // 6. 環境変数の確認（機密情報は表示しない）
  checks.environment = {
    hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
  };

  // 7. 全体の状態判定
  const allConnected = 
    checks.services.stripe?.connected === true &&
    checks.services.supabase?.connected === true &&
    checks.services.webhook?.hasWebhookSecret === true;

  checks.status = allConnected ? 'healthy' : 'degraded';
  checks.summary = {
    stripe: checks.services.stripe?.connected ? '✅ Connected' : '❌ Not Connected',
    supabase: checks.services.supabase?.connected ? '✅ Connected' : '❌ Not Connected',
    webhook: checks.services.webhook?.hasWebhookSecret ? '✅ Configured' : '❌ Not Configured',
  };

  return NextResponse.json(checks, {
    status: allConnected ? 200 : 503,
  });
}

