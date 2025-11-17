import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ビルド時に環境変数が設定されていない場合でもエラーにならないようにする
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
}) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 手動で会員情報を更新するエンドポイント（管理者用）
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { sessionId, paymentIntentId, userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'userId and plan are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 現在の会員種別を取得（lifetime会員のダウングレードを防止するため）
    const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userId);
    const currentMembershipType = currentUser?.user_metadata?.membership_type || currentUser?.app_metadata?.membership_type;

    // セッションまたはPayment Intentから情報を取得
    let sessionData: any = null;
    let detectedPlan: string | null = null;
    
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        sessionData = {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          mode: session.mode,
          metadata: session.metadata,
          amount_total: session.amount_total,
          currency: session.currency,
        };
        // セッションのmetadataからplanを取得
        detectedPlan = session.metadata?.plan || null;
      } catch (error: any) {
        console.error('Error retrieving session:', error);
      }
    }

    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        sessionData = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        };
        // Payment Intentのmetadataからplanを取得
        detectedPlan = paymentIntent.metadata?.plan || null;
      } catch (error: any) {
        console.error('Error retrieving payment intent:', error);
      }
    }

    // planが指定されていない場合、セッションまたはPayment Intentから取得
    const finalPlan = plan || detectedPlan;
    
    if (!finalPlan) {
      return NextResponse.json(
        { error: 'plan is required and could not be detected from session or payment intent' },
        { status: 400 }
      );
    }

    // ゴールド会員（lifetime）は永久会員のため、ダウングレードを防止
    if (currentMembershipType === 'lifetime' && finalPlan !== 'lifetime') {
      console.log('⚠️ ゴールド会員のダウングレードを防止（manual-update-membership）:', {
        userId,
        currentMembershipType,
        attemptedPlan: finalPlan,
        sessionId,
        paymentIntentId
      });
      return NextResponse.json(
        { error: 'Lifetime member downgrade prevented', currentMembershipType, attemptedPlan: finalPlan },
        { status: 400 }
      );
    }

    console.log('🔧 Manual update membership:', {
      userId,
      plan: finalPlan,
      sessionId,
      paymentIntentId,
      sessionData,
      detectedPlan,
      currentMembershipType
    });

    // ユーザーの会員種別を更新
    const updateData: any = {
      membership_type: finalPlan,
    };

    let expiresAt: string | null = null;
    if (finalPlan === 'subscription') {
      const expiresDate = new Date();
      expiresDate.setMonth(expiresDate.getMonth() + 1);
      expiresAt = expiresDate.toISOString();
      updateData.subscription_expires_at = expiresAt;
    } else if (finalPlan === 'lifetime') {
      // ゴールド会員（年間一括割引）: 1年後
      const expiresDate = new Date();
      expiresDate.setFullYear(expiresDate.getFullYear() + 1);
      expiresAt = expiresDate.toISOString();
      updateData.subscription_expires_at = expiresAt;
    }

    // 1. user_metadataを更新
    const { data: userData, error: userError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: updateData }
    );

    if (userError) {
      console.error('❌ Failed to update user metadata:', userError);
      return NextResponse.json(
        { error: 'Failed to update user metadata', details: userError.message },
        { status: 500 }
      );
    }

    // 2. usersテーブルも確実に更新
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .update({
        membership_type: finalPlan,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (dbError) {
      if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
        console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました');
      } else {
        console.error('❌ Failed to update users table:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      plan: finalPlan,
      expiresAt,
      updated: {
        userMetadata: !userError,
        usersTable: !dbError
      },
      userData: {
        id: userData?.user?.id,
        email: userData?.user?.email,
        membershipType: userData?.user?.user_metadata?.membership_type,
        subscriptionExpiresAt: userData?.user?.user_metadata?.subscription_expires_at,
      },
      sessionData
    });
  } catch (error: any) {
    console.error('Manual update membership error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

