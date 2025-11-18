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

    // Admin APIで全ユーザーを取得（ページネーション対応）
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
    
    console.log('📊 Admin API listUsers結果:', {
      totalPages: page - 1,
      totalUsers: allAuthUsers.length
    });

    if (paginationError) {
      console.error('Error fetching users from auth:', paginationError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: paginationError.message },
        { status: 500 }
      );
    }
    
    const authUsers = allAuthUsers;

    // auth.usersテーブルから直接raw_user_meta_dataを取得（データベースの実際のデータを反映）
    // Supabase Admin APIのlistUsers()ではuser_metadataにraw_user_meta_dataがマッピングされない場合があるため、
    // PostgreSQL関数を使用して直接取得する
    const { data: rawUsersData, error: rawUsersError } = await supabaseAdmin.rpc('get_user_metadata');
    
    // エラーハンドリングとデバッグログ
    if (rawUsersError) {
      console.error('❌ Error fetching raw user metadata:', {
        error: rawUsersError,
        message: rawUsersError.message,
        details: rawUsersError.details,
        hint: rawUsersError.hint
      });
    }
    
    console.log('📊 Raw users data fetched:', {
      count: rawUsersData?.length || 0,
      hasError: !!rawUsersError,
      sample: rawUsersData?.slice(0, 3)
    });
    
    // membership_typeのマップを作成（idをキーとして）
    const membershipTypeMap: Record<string, any> = {};
    if (rawUsersData && !rawUsersError) {
      rawUsersData.forEach((u: any) => {
        if (u.id) {
          membershipTypeMap[u.id] = {
            membership_type: u.membership_type || null,
            username: u.username || null,
            subscription_expires_at: u.subscription_expires_at || null,
            survey_gender: u.survey_gender || null,
            survey_residence: u.survey_residence || null,
            survey_residence_other: u.survey_residence_other || null,
            survey_cantonese_level: u.survey_cantonese_level || null,
            survey_completed: u.survey_completed || false,
          };
        }
      });
      
      console.log('📊 Membership type map created:', {
        totalUsers: Object.keys(membershipTypeMap).length,
        lifetimeCount: Object.values(membershipTypeMap).filter((m: any) => m.membership_type === 'lifetime').length,
        subscriptionCount: Object.values(membershipTypeMap).filter((m: any) => m.membership_type === 'subscription').length,
        freeCount: Object.values(membershipTypeMap).filter((m: any) => m.membership_type === 'free' || !m.membership_type).length
      });
    }

    // デバッグ: ゴールド会員のデータを確認
    const goldUserIds = Object.keys(membershipTypeMap).filter(id => 
      membershipTypeMap[id]?.membership_type === 'lifetime'
    );
    console.log('🔍 ゴールド会員検出（raw_user_meta_dataから）:', {
      count: goldUserIds.length,
      user_ids: goldUserIds,
      details: goldUserIds.map(id => ({
        id,
        email: authUsers?.find((u: any) => u.id === id)?.email,
        membership_type: membershipTypeMap[id]?.membership_type
      }))
    });

    // ユーザー情報をフォーマット
    const formattedUsers = (authUsers || []).map((u: any) => {
      const userMeta = u.user_metadata || {};
      const rawMeta = membershipTypeMap[u.id] || {};
      
      // raw_user_meta_dataから取得したデータを優先
      // なければuser_metadataから取得、それもなければデフォルト値
      const membershipType = rawMeta.membership_type || userMeta.membership_type || 'free';
      
      // デバッグ用: ゴールド会員のデータを確認
      if (membershipType === 'lifetime') {
        console.log('🔍 ゴールド会員検出（最終）:', {
          email: u.email,
          id: u.id,
          membership_type_from_raw: rawMeta.membership_type,
          membership_type_from_metadata: userMeta.membership_type,
          final_membership_type: membershipType,
          hasRawMeta: !!rawMeta.membership_type,
          hasUserMeta: !!userMeta.membership_type
        });
      }
      
      return {
        id: u.id,
        email: u.email,
        username: rawMeta.username || userMeta.username || null,
        membership_type: membershipType,
        subscription_expires_at: rawMeta.subscription_expires_at || userMeta.subscription_expires_at || null,
        has_password: !!u.encrypted_password,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        updated_at: u.updated_at,
        survey_gender: rawMeta.survey_gender || userMeta.survey_gender || null,
        survey_residence: rawMeta.survey_residence || userMeta.survey_residence || null,
        survey_residence_other: rawMeta.survey_residence_other || userMeta.survey_residence_other || null,
        survey_cantonese_level: rawMeta.survey_cantonese_level || userMeta.survey_cantonese_level || null,
        survey_completed: rawMeta.survey_completed !== undefined ? rawMeta.survey_completed : (userMeta.survey_completed || false),
      };
    });

    // 最終的な集計をログに出力
    const finalLifetimeCount = formattedUsers.filter(u => u.membership_type === 'lifetime').length;
    const finalSubscriptionCount = formattedUsers.filter(u => u.membership_type === 'subscription').length;
    const finalFreeCount = formattedUsers.filter(u => u.membership_type === 'free' || !u.membership_type).length;
    
    console.log('📊 最終的な会員種別集計:', {
      lifetime: finalLifetimeCount,
      subscription: finalSubscriptionCount,
      free: finalFreeCount,
      total: formattedUsers.length
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
