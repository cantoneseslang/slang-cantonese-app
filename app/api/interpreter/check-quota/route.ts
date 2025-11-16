import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FREE_TIER_LIMIT = 100;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのメンバーシップタイプを取得
    const membershipType = user.user_metadata?.membershipType || 'free';

    // 有料会員は制限なし
    if (membershipType === 'subscription' || membershipType === 'lifetime') {
      return NextResponse.json({
        allowed: true,
        usageCount: 0,
        limit: -1, // 無制限
        membershipType,
      });
    }

    // 無料会員の場合、使用回数をカウント
    const { count, error: countError } = await supabase
      .from('interpreter_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('通訳使用回数取得エラー:', countError);
      return NextResponse.json({ error: 'Failed to check quota' }, { status: 500 });
    }

    const usageCount = count ?? 0;
    const allowed = usageCount < FREE_TIER_LIMIT;

    return NextResponse.json({
      allowed,
      usageCount,
      limit: FREE_TIER_LIMIT,
      membershipType,
    });
  } catch (error) {
    console.error('Check interpreter quota error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



