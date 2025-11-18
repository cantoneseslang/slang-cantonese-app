import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    // Admin APIで全ユーザーを取得
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching users from auth:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: authError.message },
        { status: 500 }
      );
    }

    // public.usersテーブルからmembership_typeを取得（データベースの実際のデータを反映）
    const { data: publicUsers, error: publicUsersError } = await supabaseAdmin
      .from('users')
      .select('id, membership_type');
    
    // membership_typeのマップを作成（idをキーとして）
    const membershipTypeMap: Record<string, string> = {};
    if (publicUsers && !publicUsersError) {
      publicUsers.forEach((u: any) => {
        if (u.membership_type) {
          membershipTypeMap[u.id] = u.membership_type;
        }
      });
    }

    // デバッグ: ゴールド会員のデータを確認
    const goldUserIds = Object.keys(membershipTypeMap).filter(id => membershipTypeMap[id] === 'lifetime');
    if (goldUserIds.length > 0) {
      console.log('🔍 ゴールド会員検出（public.usersテーブルから）:', {
        count: goldUserIds.length,
        user_ids: goldUserIds
      });
    }

    // ユーザー情報をフォーマット
    const formattedUsers = (authUsers || []).map((u: any) => {
      const userMeta = u.user_metadata || {};
      
      // public.usersテーブルから取得したmembership_typeを優先
      // なければuser_metadataから取得、それもなければ'free'
      const membershipType = membershipTypeMap[u.id] || userMeta.membership_type || 'free';
      
      // デバッグ用: ゴールド会員のデータを確認
      if (membershipType === 'lifetime') {
        console.log('🔍 ゴールド会員検出（最終）:', {
          email: u.email,
          id: u.id,
          membership_type_from_public: membershipTypeMap[u.id],
          membership_type_from_metadata: userMeta.membership_type,
          final_membership_type: membershipType
        });
      }
      
      return {
        id: u.id,
        email: u.email,
        username: userMeta.username || null,
        membership_type: membershipType,
        subscription_expires_at: userMeta.subscription_expires_at || null,
        has_password: !!u.encrypted_password,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        survey_gender: userMeta.survey_gender || null,
        survey_residence: userMeta.survey_residence || null,
        survey_residence_other: userMeta.survey_residence_other || null,
        survey_cantonese_level: userMeta.survey_cantonese_level || null,
        survey_completed: userMeta.survey_completed || false,
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
