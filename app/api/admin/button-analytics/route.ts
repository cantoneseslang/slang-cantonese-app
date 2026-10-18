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

    const [buttonEvents, favorites, interpreterUsage, conversionEvents] = await Promise.all([
      fetchAllRows<{ user_id: string; button_key: string; created_at: string }>(
        supabaseAdmin,
        'user_button_events',
        'user_id, button_key, created_at'
      ),
      fetchAllRows<{ user_id: string; word_chinese: string; category_id: string }>(
        supabaseAdmin,
        'user_favorites',
        'user_id, word_chinese, category_id'
      ),
      fetchAllRows<{ user_id: string; language: string }>(
        supabaseAdmin,
        'interpreter_usage',
        'user_id, language'
      ),
      fetchAllRows<{ user_id: string; direction: string; char_count: number }>(
        supabaseAdmin,
        'conversion_events',
        'user_id, direction, char_count'
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
    const bookmarksByUser = new Map<string, number>();
    const favoriteWordCounts = new Map<string, number>();
    for (const fav of favorites) {
      if (!fav.user_id || !fav.word_chinese) continue;
      if (fav.category_id === 'phrase-bookmark') {
        bookmarksByUser.set(fav.user_id, (bookmarksByUser.get(fav.user_id) ?? 0) + 1);
        continue;
      }
      favoriteWordCounts.set(fav.word_chinese, (favoriteWordCounts.get(fav.word_chinese) ?? 0) + 1);
      const words = favoritesByUser.get(fav.user_id) ?? [];
      words.push(fav.word_chinese);
      favoritesByUser.set(fav.user_id, words);
    }

    const conversionByUser = new Map<string, { cantonese: number; japanese: number; chars: number }>();
    for (const event of conversionEvents) {
      if (!event.user_id) continue;
      const current = conversionByUser.get(event.user_id) ?? { cantonese: 0, japanese: 0, chars: 0 };
      if (event.direction === 'cantonese') current.cantonese += 1;
      if (event.direction === 'japanese') current.japanese += 1;
      current.chars += event.char_count || 0;
      conversionByUser.set(event.user_id, current);
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
      const conversion = conversionByUser.get(u.id) ?? { cantonese: 0, japanese: 0, chars: 0 };
      return {
        user_id: u.id,
        email: u.email || '',
        pressed,
        not_pressed: Math.max(totalButtons - pressed, 0),
        favorites_count: favoriteWords.length,
        favorite_words: favoriteWords,
        bookmark_count: bookmarksByUser.get(u.id) ?? 0,
        convert_cantonese_count: conversion.cantonese,
        convert_japanese_count: conversion.japanese,
        convert_char_count: conversion.chars,
        interpreter_cantonese_count: interpreter.cantonese,
        interpreter_mandarin_count: interpreter.mandarin,
        interpreter_total_count: interpreter.cantonese + interpreter.mandarin,
      };
    }).sort((a, b) => {
      if (b.pressed !== a.pressed) return b.pressed - a.pressed;
      return b.interpreter_total_count - a.interpreter_total_count;
    });

    const dayCounts = new Map<string, number>();
    const buttonCounts = new Map<string, number>();
    for (const event of buttonEvents) {
      if (event.button_key) {
        buttonCounts.set(event.button_key, (buttonCounts.get(event.button_key) ?? 0) + 1);
      }
      if (!event.created_at) continue;
      const day = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(event.created_at));
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }

    const dayKeys = [...dayCounts.keys()].sort();
    const daily: Array<{ day: string; count: number; cumulative: number }> = [];
    if (dayKeys.length > 0) {
      let cumulative = 0;
      const cursor = new Date(`${dayKeys[0]}T00:00:00+08:00`);
      const end = new Date(`${dayKeys[dayKeys.length - 1]}T00:00:00+08:00`);
      while (cursor.getTime() <= end.getTime()) {
        const day = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Hong_Kong',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(cursor);
        const count = dayCounts.get(day) ?? 0;
        cumulative += count;
        daily.push({ day, count, cumulative });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    const topButtons = [...buttonCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key, count]) => ({
        label: key.includes(':') ? key.slice(key.indexOf(':') + 1) : key,
        count,
      }));

    return NextResponse.json({
      success: true,
      total_buttons: totalButtons,
      users,
      daily,
      top_buttons: topButtons,
      top_favorite_words: [...favoriteWordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count })),
    });
  } catch (error: any) {
    console.error('Error fetching button analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
