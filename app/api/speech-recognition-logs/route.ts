import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const adminEmails = ['bestinksalesman@gmail.com'];

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_type,
      device_info,
      browser_info,
      recognition_state,
      error_details,
      transcript_data,
      timestamp,
      session_id,
    } = body;

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const { error } = await adminDb()
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
        created_at: timestamp || new Date().toISOString(),
      });

    if (error) {
      console.error('[speech-recognition-logs] データベース保存エラー:', error);
      return NextResponse.json({ success: false, error: '保存できませんでした' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[speech-recognition-logs] 予期しないエラー:', error);
    return NextResponse.json({ success: false, error: '保存できませんでした' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 200);
    const deviceType = searchParams.get('device_type');

    let query = adminDb()
      .from('speech_recognition_logs')
      .select('id, event_type, device_info, browser_info, recognition_state, error_details, transcript_data, session_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deviceType === 'mobile') {
      query = query.eq('device_info->>is_mobile', 'true');
    } else if (deviceType === 'desktop') {
      query = query.eq('device_info->>is_mobile', 'false');
    }

    const { data, error } = await query;
    if (error) {
      console.error('[speech-recognition-logs] データ取得エラー:', error);
      return NextResponse.json({ success: false, error: '読み込めませんでした' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count: data?.length || 0 });
  } catch (error: unknown) {
    console.error('[speech-recognition-logs] 予期しないエラー:', error);
    return NextResponse.json({ success: false, error: '読み込めませんでした' }, { status: 500 });
  }
}
