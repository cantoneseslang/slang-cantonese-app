import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getButtonCounts } from '@/lib/analytics/buttonCounts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者チェック
    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    // 総ボタン数を取得
    const counts = getButtonCounts();
    const totalButtons = counts.total;

    // Service Role Keyを使ってAdmin APIでユーザーを取得
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service Role Keyが設定されていません' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // 全ユーザーを取得
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: authError.message },
        { status: 500 }
      );
    }

    // ユーザーごとのボタン押下数を取得（user_button_eventsテーブルから）
    const users: Array<{ user_id: string; email: string; pressed: number; not_pressed: number }> = [];

    if (authUsers) {
      // 各ユーザーの押下数を取得
      for (const u of authUsers) {
        // user_button_eventsテーブルから、このユーザーが押したボタンのユニーク数を取得
        const { data: buttonEvents, error: eventsError } = await supabaseAdmin
          .from('user_button_events')
          .select('button_key')
          .eq('user_id', u.id);

        if (eventsError) {
          console.error(`Error fetching button events for user ${u.id}:`, eventsError);
        }

        // ユニークなボタンキーの数をカウント
        const uniqueButtons = new Set(buttonEvents?.map(e => e.button_key) || []);
        const pressed = uniqueButtons.size;
        const not_pressed = totalButtons - pressed;
        
        users.push({
          user_id: u.id,
          email: u.email || '',
          pressed,
          not_pressed
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_buttons: totalButtons,
      users
    });
  } catch (error: any) {
    console.error('Error fetching button analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
