import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

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
    const server = await createServerClient();
    const { data: { user: sessionUser } } = await server.auth.getUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, paymentIntentId, userId, plan } = body;
    if (userId && userId !== sessionUser.id) {
      return NextResponse.json({ error: '自分の会員情報だけ更新できます' }, { status: 403 });
    }

    let resolvedPlan = plan as string | undefined;
    if (resolvedPlan && !['free', 'subscription', 'lifetime'].includes(resolvedPlan)) {
      return NextResponse.json({ error: 'plan is invalid' }, { status: 400 });
    }

    if (resolvedPlan !== 'free') {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
      }
      if (sessionId) {
        const checkout = await stripe.checkout.sessions.retrieve(sessionId);
        const paid = checkout.payment_status === 'paid' || checkout.status === 'complete';
        if (!paid || checkout.metadata?.user_id !== sessionUser.id) {
          return NextResponse.json({ error: '支払いを確認できません' }, { status: 403 });
        }
        const stripePlan = checkout.metadata?.plan;
        if (stripePlan !== 'subscription' && stripePlan !== 'lifetime') {
          return NextResponse.json({ error: '支払い内容を確認できません' }, { status: 400 });
        }
        if (resolvedPlan && resolvedPlan !== stripePlan) {
          return NextResponse.json({ error: '支払い内容と会員種別が一致しません' }, { status: 400 });
        }
        resolvedPlan = stripePlan;
      } else if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded' || paymentIntent.metadata?.user_id !== sessionUser.id) {
          return NextResponse.json({ error: '支払いを確認できません' }, { status: 403 });
        }
        const stripePlan = paymentIntent.metadata?.plan;
        if (stripePlan !== 'subscription' && stripePlan !== 'lifetime') {
          return NextResponse.json({ error: '支払い内容を確認できません' }, { status: 400 });
        }
        if (resolvedPlan && resolvedPlan !== stripePlan) {
          return NextResponse.json({ error: '支払い内容と会員種別が一致しません' }, { status: 400 });
        }
        resolvedPlan = stripePlan;
      } else {
        return NextResponse.json({ error: '支払いの確認が必要です' }, { status: 400 });
      }
    } else {
      resolvedPlan = 'free';
    }

    const userIdToUpdate = sessionUser.id;
    const planToApply = resolvedPlan;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userIdToUpdate);
    const currentMembershipType = currentUser?.user_metadata?.membership_type || currentUser?.app_metadata?.membership_type;
    const finalPlan = planToApply;

    if (currentMembershipType === 'lifetime' && finalPlan !== 'lifetime') {
      return NextResponse.json(
        { error: 'Lifetime member downgrade prevented' },
        { status: 400 }
      );
    }

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
    const { error: userError } = await supabase.auth.admin.updateUserById(
      userIdToUpdate,
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
      .eq('id', userIdToUpdate)
      .select('id');

    if (dbError) {
      if (dbError.code === 'PGRST116' || dbError.message.includes('relation') || dbError.message.includes('does not exist')) {
        console.warn('⚠️ usersテーブルが存在しないため、user_metadataのみ更新しました');
      } else {
        console.error('❌ Failed to update users table:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      plan: finalPlan,
      expiresAt,
      updated: {
        userMetadata: !userError,
        usersTable: !dbError
      },
    });
  } catch (error: any) {
    console.error('Manual update membership error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

