import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      event_type,
      device_info,
      browser_info,
      recognition_state,
      error_details,
      transcript_data,
      timestamp,
      session_id
    } = body;

    // デバイス情報とブラウザ情報を取得
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // ログをデータベースに保存
    const { data, error } = await supabase
      .from('speech_recognition_logs')
      .insert({
        event_type,
        device_info: device_info || {},
        browser_info: browser_info || {},
        recognition_state: recognition_state || {},
        error_details: error_details || null,
        transcript_data: transcript_data || null,
        user_agent: userAgent,
        ip_address: ip,
        session_id: session_id || null,
        created_at: timestamp || new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('[speech-recognition-logs] データベース保存エラー:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[speech-recognition-logs] 予期しないエラー:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const deviceType = searchParams.get('device_type'); // 'mobile' or 'desktop'

    let query = supabase
      .from('speech_recognition_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deviceType) {
      query = query.eq('device_info->>is_mobile', deviceType === 'mobile' ? 'true' : 'false');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[speech-recognition-logs] データ取得エラー:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count: data?.length || 0 });
  } catch (error: any) {
    console.error('[speech-recognition-logs] 予期しないエラー:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

