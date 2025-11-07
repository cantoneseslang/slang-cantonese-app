import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron Jobs用のエンドポイント
// vercel.jsonで設定: "0 0 * * *" (毎日0時に実行)

export async function GET(request: NextRequest) {
  try {
    // 認証: Vercel Cron Jobsからのリクエストを検証
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // テスト期間終了日のチェック
    const testPeriodEndDate = process.env.TEST_PERIOD_END_DATE;
    const now = new Date();
    let testPeriodEnded = false;
    let testPeriodDowngradeCount = 0;

    if (testPeriodEndDate) {
      const endDate = new Date(testPeriodEndDate);
      if (now >= endDate) {
        // テスト期間が終了している場合、すべての有料会員をブロンズに戻す
        testPeriodEnded = true;
        console.log('テスト期間が終了しました。すべての有料会員をブロンズに戻します。');

        const { data: paidUsers, error: paidUsersError } = await supabase
          .from('users')
          .update({
            membership_type: 'free',
            subscription_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .in('membership_type', ['subscription', 'lifetime'])
          .select('id');

        if (paidUsersError) {
          console.error('Error downgrading paid users after test period:', paidUsersError);
        } else {
          testPeriodDowngradeCount = paidUsers?.length || 0;

          // user_metadataも更新（Supabase Authのuser_metadataと同期）
          if (testPeriodDowngradeCount > 0) {
            for (const user of paidUsers) {
              try {
                await supabase.auth.admin.updateUserById(user.id, {
                  user_metadata: {
                    membership_type: 'free'
                  }
                });
              } catch (err) {
                console.error(`Failed to update user_metadata for user ${user.id}:`, err);
              }
            }
          }
        }
      }
    }

    // 通常の期限切れサブスクリプション会員をブロンズに戻す（テスト期間終了後も実行）
    const { data, error } = await supabase
      .from('users')
      .update({
        membership_type: 'free',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('membership_type', 'subscription')
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error downgrading expired subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to downgrade expired subscriptions', details: error.message },
        { status: 500 }
      );
    }

    const updatedCount = data?.length || 0;

    // user_metadataも更新（Supabase Authのuser_metadataと同期）
    if (updatedCount > 0) {
      for (const user of data) {
        try {
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              membership_type: 'free'
            }
          });
        } catch (err) {
          console.error(`Failed to update user_metadata for user ${user.id}:`, err);
        }
      }
    }

    const response: any = {
      success: true,
      message: `Downgraded ${updatedCount} expired subscriptions to free tier`,
      updatedCount
    };

    if (testPeriodEnded) {
      response.testPeriodEnded = true;
      response.testPeriodDowngradeCount = testPeriodDowngradeCount;
      response.message = `テスト期間終了により${testPeriodDowngradeCount}人の有料会員をブロンズに戻しました。また、${updatedCount}人の期限切れサブスクリプション会員をブロンズに戻しました。`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



