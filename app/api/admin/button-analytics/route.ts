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

    // 全ユーザーを取得（ページネーション対応）
    // listUsers()はデフォルトで最大50件しか返さないため、全ユーザーを取得する
    let allAuthUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    let paginationError: any = null;
    
    while (hasMore) {
      const { data: { users: pageUsers }, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000 // 最大1000件まで一度に取得
      });
      
      if (pageError) {
        console.error(`Error fetching users page ${page}:`, pageError);
        paginationError = pageError;
        break;
      }
      
      if (pageUsers && pageUsers.length > 0) {
        allAuthUsers = [...allAuthUsers, ...pageUsers];
        page++;
        // 1000件未満の場合は最終ページ
        if (pageUsers.length < 1000) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    console.log('📊 Button Analytics - Admin API listUsers結果:', {
      totalPages: page - 1,
      totalUsers: allAuthUsers.length
    });
    
    if (paginationError) {
      console.error('Error fetching users:', paginationError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: paginationError.message },
        { status: 500 }
      );
    }
    
    const authUsers = allAuthUsers;

    // ユーザーごとのボタン押下数とお気に入り情報を取得
    const users: Array<{ 
      user_id: string; 
      email: string; 
      pressed: number; 
      not_pressed: number;
      favorites_count: number;
      favorite_words: string[];
      interpreter_cantonese_count: number;
      interpreter_mandarin_count: number;
      interpreter_total_count: number;
    }> = [];

    if (authUsers) {
      // 各ユーザーの押下数とお気に入り情報を取得
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

        // user_favoritesテーブルから、このユーザーのお気に入りを取得
        const { data: favorites, error: favoritesError } = await supabaseAdmin
          .from('user_favorites')
          .select('word_chinese')
          .eq('user_id', u.id);

        if (favoritesError) {
          console.error(`Error fetching favorites for user ${u.id}:`, favoritesError);
        }

        const favoriteWords = (favorites || []).map((f: any) => f.word_chinese).filter(Boolean);
        const favorites_count = favoriteWords.length;

        // interpreter_usageテーブルから、このユーザーの通訳使用回数を取得
        const { data: interpreterUsage, error: interpreterError } = await supabaseAdmin
          .from('interpreter_usage')
          .select('language')
          .eq('user_id', u.id);

        if (interpreterError) {
          console.error(`Error fetching interpreter usage for user ${u.id}:`, interpreterError);
        }

        const cantoneseCount = (interpreterUsage || []).filter((u: any) => u.language === 'cantonese').length;
        const mandarinCount = (interpreterUsage || []).filter((u: any) => u.language === 'mandarin').length;
        const interpreterTotalCount = cantoneseCount + mandarinCount;
        
        users.push({
          user_id: u.id,
          email: u.email || '',
          pressed,
          not_pressed,
          favorites_count,
          favorite_words: favoriteWords,
          interpreter_cantonese_count: cantoneseCount,
          interpreter_mandarin_count: mandarinCount,
          interpreter_total_count: interpreterTotalCount
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
