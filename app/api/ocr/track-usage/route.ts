import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { fileType, characterCount } = body;

    if (!fileType || typeof characterCount !== 'number') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // OCR使用を記録
    const { error } = await supabase
      .from('ocr_usage')
      .insert({
        user_id: user.id,
        file_type: fileType,
        character_count: characterCount
      });

    if (error) {
      console.error('OCR使用記録エラー:', error);
      return NextResponse.json({ error: 'Failed to track OCR usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('OCR tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

