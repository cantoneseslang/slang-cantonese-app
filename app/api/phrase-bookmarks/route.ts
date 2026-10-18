import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CATEGORY_ID = 'phrase-bookmark';

type Bookmark = { phrase: string; source: 'cantonese' | 'japanese'; query: string; translation: string };

function translationText(value: unknown) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || text.includes('翻訳に失敗')) return '';
  return text;
}

function decodeBookmark(phrase: string, raw: string | null): Bookmark {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && (parsed.source === 'cantonese' || parsed.source === 'japanese')) {
      const query = typeof parsed.query === 'string' && parsed.query.trim() ? parsed.query.trim() : phrase;
      return { phrase, source: parsed.source, query, translation: translationText(parsed.translation) };
    }
  } catch {
    // older rows stored a translation string; replay them as Cantonese input
  }
  return { phrase, source: 'cantonese', query: phrase, translation: '' };
}

async function listForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('word_chinese, word_japanese')
    .eq('user_id', userId)
    .eq('category_id', CATEGORY_ID);

  if (error) {
    throw error;
  }

  return (data || []).map((row) => decodeBookmark(row.word_chinese, row.word_japanese || ''));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ bookmarks: [], authenticated: false });
    }
    const bookmarks = await listForUser(supabase, user.id);
    return NextResponse.json({ bookmarks, authenticated: true });
  } catch (error) {
    console.error('phrase-bookmarks list error:', error);
    return NextResponse.json({ bookmarks: [], error: 'failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'login required', authenticated: false }, { status: 401 });
    }

    const body = await request.json();
    const phrase = typeof body.phrase === 'string' ? body.phrase.trim() : '';
    const source = body.source === 'japanese' ? 'japanese' : 'cantonese';
    const query = typeof body.query === 'string' && body.query.trim() ? body.query.trim() : phrase;
    const translation = translationText(body.translation);
    if (!phrase) {
      return NextResponse.json({ error: 'phrase required' }, { status: 400 });
    }

    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', CATEGORY_ID)
      .eq('word_chinese', phrase)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          category_id: CATEGORY_ID,
          word_chinese: phrase,
          word_japanese: JSON.stringify({ source, query, translation }),
        });
      if (insertError) throw insertError;
    }

    const bookmarks = await listForUser(supabase, user.id);
    return NextResponse.json({ bookmarks, bookmarked: !existing, authenticated: true });
  } catch (error) {
    console.error('phrase-bookmarks toggle error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
