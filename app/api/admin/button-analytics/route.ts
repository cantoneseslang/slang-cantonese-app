import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // ユーザーごとのボタン押下数を取得（現在はtrack-buttonがSupabaseに保存していないため、空の配列を返す）
    // 将来的にSupabaseにボタン押下履歴を保存する場合は、ここでクエリを追加
    const users: Array<{ user_id: string; email: string; pressed: number; not_pressed: number }> = [];

    // 全ユーザーを取得して、各ユーザーの押下数と未押数を計算
    // 現在はtrack-buttonがSupabaseに保存していないため、全ユーザーに対して0押下、全ボタン未押下として返す
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    
    if (authUsers) {
      for (const u of authUsers) {
        // 現在はボタン押下履歴がSupabaseに保存されていないため、0押下として扱う
        const pressed = 0;
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
  } catch (error) {
    console.error('Error fetching button analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
