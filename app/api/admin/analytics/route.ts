import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// ビルド時に環境変数が設定されていない場合でもエラーにならないようにする
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
}) : null;

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
    const monthlyData: { [key: string]: { registrations: number; revenueJPY: number; revenueHKD: number } } = {};
    
    // 過去12ヶ月分の初期化
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { registrations: 0, revenueJPY: 0, revenueHKD: 0 };
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
    if (!stripe) {
      console.warn('Stripe is not configured. Skipping revenue data.');
    } else {
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

        let totalRevenueJPY = 0;
        let totalRevenueHKD = 0;
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
              // 通貨ごとに別々に集計
              if (pi.currency === 'jpy') {
                // JPYはそのまま
                const amountJPY = pi.amount;
                monthlyData[key].revenueJPY += amountJPY;
                totalRevenueJPY += amountJPY;
                console.log(`💴 JPY決済: ${pi.id}, customer: ${pi.customer}, ¥${amountJPY}, 日付: ${piDate.toLocaleDateString('ja-JP')}`);
              } else if (pi.currency === 'hkd') {
                // HKDはセント単位なので100で割る
                const amountHKD = pi.amount / 100;
                monthlyData[key].revenueHKD += amountHKD;
                totalRevenueHKD += amountHKD;
                console.log(`💵 HKD決済: ${pi.id}, customer: ${pi.customer}, HK$${amountHKD}, 日付: ${piDate.toLocaleDateString('ja-JP')}`);
              } else {
                console.log(`⚠️ 未対応通貨: ${pi.currency}, ${pi.id}`);
              }
              
              validPaymentCount++;
            }
          }
        });
        
        console.log(`📈 集計結果: 有効な決済 ${validPaymentCount}件, スキップ ${skippedPaymentCount}件`);
        console.log(`💴 JPY合計: ¥${totalRevenueJPY}`);
        console.log(`💵 HKD合計: HK$${totalRevenueHKD}`);
        console.log('📈 月別売上データ:', monthlyData);
      } catch (stripeError) {
        console.error('Stripe data fetch error:', stripeError);
        // Stripeエラーは無視して続行
      }
    }

    // データを配列に変換
    const chartData = Object.keys(monthlyData)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        return {
          month: `${year}/${month}`,
          registrations: monthlyData[key].registrations,
          revenueJPY: Math.round(monthlyData[key].revenueJPY), // 四捨五入
          revenueHKD: Math.round(monthlyData[key].revenueHKD), // 四捨五入
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

