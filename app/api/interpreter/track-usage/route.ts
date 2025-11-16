import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { language } = body;

    if (!language || !['cantonese', 'mandarin'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    // 使用回数を記録
    const { error: insertError } = await supabase
      .from('interpreter_usage')
      .insert({
        user_id: user.id,
        language: language,
      });

    if (insertError) {
      console.error('通訳使用記録エラー:', insertError);
      return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track interpreter usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

