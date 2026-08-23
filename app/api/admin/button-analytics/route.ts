import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { getButtonCounts } from '@/lib/analytics/buttonCounts';

export const maxDuration = 60;

async function fetchAllRows<T>(
  client: SupabaseClient,
  table: string,
  columns: string
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      break;
    }
    rows.push(...(data as T[]));
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const counts = getButtonCounts();
    const totalButtons = counts.total;

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

    let allAuthUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data: { users: pageUsers }, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      });
      
      if (pageError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users', details: pageError.message },
          { status: 500 }
        );
      }
      
      if (pageUsers && pageUsers.length > 0) {
        allAuthUsers = [...allAuthUsers, ...pageUsers];
        page++;
        if (pageUsers.length < 1000) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const [buttonEvents, favorites, interpreterUsage] = await Promise.all([
      fetchAllRows<{ user_id: string; button_key: string }>(
        supabaseAdmin,
        'user_button_events',
        'user_id, button_key'
      ),
      fetchAllRows<{ user_id: string; word_chinese: string }>(
        supabaseAdmin,
        'user_favorites',
        'user_id, word_chinese'
      ),
      fetchAllRows<{ user_id: string; language: string }>(
        supabaseAdmin,
        'interpreter_usage',
        'user_id, language'
      ),
    ]);

    const pressedByUser = new Map<string, Set<string>>();
    for (const event of buttonEvents) {
      if (!event.user_id || !event.button_key) continue;
      const keys = pressedByUser.get(event.user_id) ?? new Set<string>();
      keys.add(event.button_key);
      pressedByUser.set(event.user_id, keys);
    }

    const favoritesByUser = new Map<string, string[]>();
    for (const fav of favorites) {
      if (!fav.user_id || !fav.word_chinese) continue;
      const words = favoritesByUser.get(fav.user_id) ?? [];
      words.push(fav.word_chinese);
      favoritesByUser.set(fav.user_id, words);
    }

    const interpreterByUser = new Map<string, { cantonese: number; mandarin: number }>();
    for (const usage of interpreterUsage) {
      if (!usage.user_id) continue;
      const current = interpreterByUser.get(usage.user_id) ?? { cantonese: 0, mandarin: 0 };
      if (usage.language === 'cantonese') current.cantonese += 1;
      if (usage.language === 'mandarin') current.mandarin += 1;
      interpreterByUser.set(usage.user_id, current);
    }

    const users = allAuthUsers.map((u) => {
      const pressed = pressedByUser.get(u.id)?.size ?? 0;
      const favoriteWords = favoritesByUser.get(u.id) ?? [];
      const interpreter = interpreterByUser.get(u.id) ?? { cantonese: 0, mandarin: 0 };
      return {
        user_id: u.id,
        email: u.email || '',
        pressed,
        not_pressed: Math.max(totalButtons - pressed, 0),
        favorites_count: favoriteWords.length,
        favorite_words: favoriteWords,
        interpreter_cantonese_count: interpreter.cantonese,
        interpreter_mandarin_count: interpreter.mandarin,
        interpreter_total_count: interpreter.cantonese + interpreter.mandarin,
      };
    }).sort((a, b) => {
      if (b.pressed !== a.pressed) return b.pressed - a.pressed;
      return b.interpreter_total_count - a.interpreter_total_count;
    });

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
