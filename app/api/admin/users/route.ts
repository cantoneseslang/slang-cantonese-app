import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 管理者チェック（実際の実装では、Supabaseのadmin APIまたはカスタムテーブルを使用）
    const adminEmails = ['bestinksalesman@gmail.com'];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Supabaseのusersテーブルからユーザーを取得
    // usersテーブルが存在しない場合は空配列を返す
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, membership_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      // テーブルが存在しない場合（PGRST116エラー）は空配列を返す
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('schema')) {
        console.warn('Users table does not exist, returning empty array');
        return NextResponse.json({ users: [] });
      }
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

