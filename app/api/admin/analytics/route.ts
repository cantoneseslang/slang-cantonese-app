import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

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

    // 全ユーザーを取得
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching users from auth:', authError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users', details: authError.message },
        { status: 500 }
      );
    }

    // 月別の会員登録数を集計（過去12ヶ月）
    const now = new Date();
    const monthlyData: { [key: string]: { registrations: number; revenue: number } } = {};
    
    // 過去12ヶ月分の初期化
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { registrations: 0, revenue: 0 };
    }

    // 会員登録数を集計
    (authUsers || []).forEach((u: any) => {
      const createdAt = new Date(u.created_at);
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key].registrations++;
      }
    });

    // Stripeの支払いデータを取得（過去12ヶ月）
    try {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(twelveMonthsAgo.getTime() / 1000),
        },
        limit: 100, // 必要に応じて調整
      });

      // 支払いを月別に集計
      charges.data.forEach((charge) => {
        if (charge.status === 'succeeded') {
          const chargeDate = new Date(charge.created * 1000);
          const key = `${chargeDate.getFullYear()}-${String(chargeDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyData[key] !== undefined) {
            // JPYの場合、amountはそのまま円単位
            // USDなどの場合、amount / 100でドル単位
            const amount = charge.currency === 'jpy' ? charge.amount : charge.amount / 100;
            monthlyData[key].revenue += amount;
          }
        }
      });
    } catch (stripeError) {
      console.error('Stripe data fetch error:', stripeError);
      // Stripeエラーは無視して続行
    }

    // データを配列に変換
    const chartData = Object.keys(monthlyData)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        return {
          month: `${year}/${month}`,
          registrations: monthlyData[key].registrations,
          revenue: Math.round(monthlyData[key].revenue), // 四捨五入
        };
      });

    return NextResponse.json({ 
      success: true, 
      data: chartData,
      totalUsers: authUsers?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

