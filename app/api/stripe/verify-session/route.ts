import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Stripeセッションを取得
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('🔔 verify-session: Session retrieved:', {
      sessionId: session.id,
      payment_status: session.payment_status,
      status: session.status,
      mode: session.mode,
      metadata: session.metadata
    });

    // セッションが完了していない場合はエラー
    // lifetimeプランの場合、payment_statusが'paid'またはstatusが'complete'のいずれかでOK
    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      console.warn('⚠️ verify-session: Session not paid or not complete:', {
        sessionId: session.id,
        payment_status: session.payment_status,
        status: session.status,
        mode: session.mode
      });
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan as 'subscription' | 'lifetime';

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing metadata in session' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ユーザーの会員種別を更新
    const updateData: any = {
      membership_type: plan,
    };

    // サブスクリプションの場合は有効期限を設定、lifetimeの場合はnullに設定
    let expiresAt: string | null = null;
    if (plan === 'subscription') {
      const expiresDate = new Date();
      expiresDate.setMonth(expiresDate.getMonth() + 1);
      expiresAt = expiresDate.toISOString();
      updateData.subscription_expires_at = expiresAt;
    } else if (plan === 'lifetime') {
      // lifetimeプランの場合はsubscription_expires_atをnullに設定（期限なし）
      expiresAt = null;
      updateData.subscription_expires_at = null;
    }

    // 1. user_metadataを更新
    const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: updateData
      }
    );

    if (userError) {
      console.error('Failed to update user metadata:', userError);
    }

    // 2. usersテーブルも確実に更新
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .update({
        membership_type: plan,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (dbError) {
      console.error('Failed to update users table:', dbError);
    }

    // どちらかが成功すればOK
    if (userError && dbError) {
      return NextResponse.json(
        { error: 'Failed to update membership', details: { userError, dbError } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      membershipType: plan,
      expiresAt,
      updated: {
        userMetadata: !userError,
        usersTable: !dbError
      }
    });
  } catch (error: any) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


