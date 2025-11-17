import { NextRequest, NextResponse } from 'next/server';

// 環境変数の存在確認（エラーを防ぐため）
let stripe: any = null;
let supabase: any = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe').default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
} catch (error) {
  console.warn('Stripe initialization failed:', error);
}

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
} catch (error) {
  console.warn('Supabase initialization failed:', error);
}

export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  // 1. Stripe接続確認
  if (!stripe) {
    checks.services.stripe = {
      connected: false,
      error: 'Stripe not initialized (STRIPE_SECRET_KEY not set)',
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    };
  } else {
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
  }

  // 2. Supabase接続確認
  if (!supabase) {
    checks.services.supabase = {
      connected: false,
      error: 'Supabase not initialized (environment variables not set)',
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    };
  } else {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      
      checks.services.supabase = {
        connected: true,
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set',
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        canQuery: !error,
        queryError: error?.message || null,
      };
    } catch (error: any) {
      checks.services.supabase = {
        connected: false,
        error: error.message,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    }
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
  if (stripe && checks.services.stripe?.connected) {
    try {
      const events = await stripe.events.list({
        limit: 5,
        types: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'],
      });
      
      checks.services.stripe.recentEvents = events.data.map((event: any) => ({
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode,
      }));
    } catch (error: any) {
      checks.services.stripe.recentEventsError = error.message;
    }
  }

  // 5. 最近のサブスクリプション確認
  if (stripe && checks.services.stripe?.connected) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: 5,
        status: 'all',
      });
      
      checks.services.stripe.recentSubscriptions = subscriptions.data.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        created: new Date(sub.created * 1000).toISOString(),
        metadata: sub.metadata,
      }));
    } catch (error: any) {
      checks.services.stripe.recentSubscriptionsError = error.message;
    }
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

