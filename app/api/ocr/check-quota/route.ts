import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 会員種別を取得
    const membershipType = user.user_metadata?.membership_type || 'free';

    // ブロンズ会員以外は無制限
    if (membershipType !== 'free') {
      return NextResponse.json({
        usageCount: 0,
        limit: -1, // 無制限
        canUse: true,
        membershipType
      });
    }

    // ブロンズ会員のOCR使用回数を取得
    const { count, error } = await supabase
      .from('ocr_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('OCR使用回数取得エラー:', error);
      return NextResponse.json({ error: 'Failed to fetch OCR usage' }, { status: 500 });
    }

    const usageCount = count || 0;
    const limit = 10; // ブロンズ会員は10回まで
    const canUse = usageCount < limit;

    return NextResponse.json({
      usageCount,
      limit,
      canUse,
      membershipType
    });
  } catch (error) {
    console.error('OCR quota check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

