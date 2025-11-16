import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
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

    // Supabaseに登録されている実際のユーザーのStripe顧客IDを取得
    const validStripeCustomerIds = new Set<string>();
    (authUsers || []).forEach((u: any) => {
      const stripeCustomerId = u.user_metadata?.stripe_customer_id;
      if (stripeCustomerId) {
        validStripeCustomerIds.add(stripeCustomerId);
      }
    });

    console.log(`✅ 有効なStripe顧客ID数: ${validStripeCustomerIds.size}`, Array.from(validStripeCustomerIds));

    // Stripeの支払いデータを取得（過去12ヶ月）
    try {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      
      // PaymentIntentsを使用（より正確な支払いデータ）
      const paymentIntents = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(twelveMonthsAgo.getTime() / 1000),
        },
        limit: 100,
      });

      console.log(`📊 取得したPaymentIntents数: ${paymentIntents.data.length}`);

      let totalRevenue = 0;
      let validPaymentCount = 0;
      let skippedPaymentCount = 0;

      // 支払いを月別に集計（実際のユーザーの決済のみ）
      paymentIntents.data.forEach((pi) => {
        if (pi.status === 'succeeded' && pi.amount > 0) {
          // 実際のユーザーの決済のみをカウント
          if (!pi.customer || !validStripeCustomerIds.has(pi.customer as string)) {
            console.log(`⏭️ スキップ（テスト決済）: ${pi.id}, customer: ${pi.customer || 'なし'}`);
            skippedPaymentCount++;
            return;
          }

          const piDate = new Date(pi.created * 1000);
          const key = `${piDate.getFullYear()}-${String(piDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthlyData[key] !== undefined) {
            let amount = 0;
            
            // 通貨に応じて金額を変換（JPY建ての金額に統一）
            if (pi.currency === 'jpy') {
              // JPYはそのまま
              amount = pi.amount;
            } else if (pi.currency === 'hkd') {
              // HKDはセント単位なので100で割って、さらに為替レートで換算（簡易的に1 HKD = 20 JPY）
              amount = (pi.amount / 100) * 20;
            } else {
              // その他の通貨（セント単位）
              amount = pi.amount / 100;
            }
            
            console.log(`💰 有効な支払い: ${pi.id}, customer: ${pi.customer}, ${pi.currency.toUpperCase()} ${pi.amount}, 換算後: ¥${amount}, 日付: ${piDate.toLocaleDateString('ja-JP')}`);
            
            monthlyData[key].revenue += amount;
            totalRevenue += amount;
            validPaymentCount++;
          }
        }
      });
      
      console.log(`📈 集計結果: 有効な決済 ${validPaymentCount}件, スキップ ${skippedPaymentCount}件, 合計売上: ¥${totalRevenue}`);
      console.log('📈 月別売上データ:', monthlyData);
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

