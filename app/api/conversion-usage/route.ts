import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CONVERSION_CHAR_LIMIT,
  CONVERSION_DAILY_LIMIT,
  hongKongDayStartIso,
  type ConversionDirection,
} from '@/lib/conversion-limits';

function isPaid(user: { user_metadata?: Record<string, unknown> }) {
  const membership = user.user_metadata?.membership_type;
  const expiresAt = user.user_metadata?.subscription_expires_at;
  if (membership === 'lifetime') return true;
  if (membership !== 'subscription') return false;
  if (typeof expiresAt !== 'string' || !expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

async function usageForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const dayStart = hongKongDayStartIso();
  const [{ count: dailyCount, error: dailyError }, { data: charRows, error: charError }] = await Promise.all([
    supabase
      .from('conversion_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayStart),
    supabase
      .from('conversion_events')
      .select('char_count')
      .eq('user_id', userId),
  ]);
  if (dailyError) throw dailyError;
  if (charError) throw charError;
  const charsUsed = (charRows || []).reduce((sum, row) => sum + (row.char_count || 0), 0);
  return { charsUsed, dailyCount: dailyCount || 0 };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: true, logged: false });
  }
  try {
    const usage = await usageForUser(supabase, user.id);
    return NextResponse.json({
      success: true,
      logged: true,
      limited: !isPaid(user),
      ...usage,
      charLimit: CONVERSION_CHAR_LIMIT,
      dailyLimit: CONVERSION_DAILY_LIMIT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '利用状況を読めませんでした';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: true, allowed: true, logged: false });
  }

  const body = await request.json().catch(() => null);
  const direction = body?.direction as ConversionDirection;
  const charCount = Number(body?.charCount);
  if ((direction !== 'cantonese' && direction !== 'japanese') || !Number.isInteger(charCount) || charCount < 1) {
    return NextResponse.json({ success: false, error: '変換内容が不正です' }, { status: 400 });
  }

  try {
    const paid = isPaid(user);
    if (paid) {
      const { error } = await supabase.from('conversion_events').insert({
        user_id: user.id,
        direction,
        char_count: charCount,
      });
      if (error) throw error;
      return NextResponse.json({
        success: true,
        allowed: true,
        logged: true,
        limited: false,
      });
    }

    const usage = await usageForUser(supabase, user.id);
    if (usage.charsUsed + charCount > CONVERSION_CHAR_LIMIT) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: 'chars',
        ...usage,
        charLimit: CONVERSION_CHAR_LIMIT,
        dailyLimit: CONVERSION_DAILY_LIMIT,
      });
    }
    if (usage.dailyCount >= CONVERSION_DAILY_LIMIT) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: 'daily',
        ...usage,
        charLimit: CONVERSION_CHAR_LIMIT,
        dailyLimit: CONVERSION_DAILY_LIMIT,
      });
    }

    const { error } = await supabase.from('conversion_events').insert({
      user_id: user.id,
      direction,
      char_count: charCount,
    });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      allowed: true,
      logged: true,
      limited: true,
      charsUsed: usage.charsUsed + charCount,
      dailyCount: usage.dailyCount + 1,
      charLimit: CONVERSION_CHAR_LIMIT,
      dailyLimit: CONVERSION_DAILY_LIMIT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '利用状況を保存できませんでした';
    return NextResponse.json({ success: false, allowed: false, error: message }, { status: 500 });
  }
}
