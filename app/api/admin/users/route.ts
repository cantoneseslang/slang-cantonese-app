import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者チェック（実際の実装では、Supabaseのadmin APIまたはカスタムテーブルを使用）
    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Supabaseのauth.usersテーブルからユーザーを取得
    // 注意: これはService Role Keyが必要な場合があります
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, membership_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

