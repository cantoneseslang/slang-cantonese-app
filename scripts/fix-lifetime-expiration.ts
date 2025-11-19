/**
 * ゴールド会員（lifetime）の有効期限を修正するスクリプト
 * 
 * 問題: 有効期限が2年後に設定されているユーザーが存在する
 * 原因: Webhookで有効期限を2回加算していた
 * 解決: 購入日から1年後に修正する
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixLifetimeExpiration() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  console.log('🔍 ゴールド会員（lifetime）のユーザーを検索中...');

  // lifetime会員を取得
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ ユーザー取得エラー:', error);
    return;
  }

  console.log(`📊 全ユーザー数: ${users.users.length}`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const user of users.users) {
    const membershipType = user.user_metadata?.membership_type;
    const currentExpiration = user.user_metadata?.subscription_expires_at;

    if (membershipType === 'lifetime') {
      console.log('\n📋 ユーザー情報:', {
        id: user.id,
        email: user.email,
        membershipType,
        currentExpiration,
        createdAt: user.created_at,
      });

      // 有効期限をチェック
      if (currentExpiration) {
        const expirationDate = new Date(currentExpiration);
        const createdDate = new Date(user.created_at);
        const now = new Date();

        // 作成日から1年後を計算
        const correctExpiration = new Date(createdDate);
        correctExpiration.setFullYear(correctExpiration.getFullYear() + 1);

        // 有効期限が正しくない場合（作成日から1年以上後）
        const daysDifference = Math.floor(
          (expirationDate.getTime() - correctExpiration.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDifference > 30) {
          // 30日以上の差がある場合は修正が必要
          console.log('⚠️ 有効期限が不正です:', {
            current: expirationDate.toISOString(),
            correct: correctExpiration.toISOString(),
            daysDifference,
          });

          // ユーザーに確認を求める（実際の修正はコメントアウト）
          console.log('💡 修正予定:', {
            userId: user.id,
            from: expirationDate.toISOString(),
            to: correctExpiration.toISOString(),
          });

          // 実際に修正する場合は以下のコメントを外す
          /*
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              subscription_expires_at: correctExpiration.toISOString(),
            },
          });

          if (updateError) {
            console.error('❌ 更新エラー:', updateError);
          } else {
            console.log('✅ 更新成功');
            fixedCount++;
          }
          */

          fixedCount++;
        } else {
          console.log('✅ 有効期限は正常です');
          skippedCount++;
        }
      } else {
        console.log('⚠️ 有効期限が設定されていません');
        
        // 有効期限を設定（作成日から1年後）
        const createdDate = new Date(user.created_at);
        const correctExpiration = new Date(createdDate);
        correctExpiration.setFullYear(correctExpiration.getFullYear() + 1);

        console.log('💡 修正予定:', {
          userId: user.id,
          to: correctExpiration.toISOString(),
        });

        fixedCount++;
      }
    }
  }

  console.log('\n📊 結果:');
  console.log(`修正が必要: ${fixedCount}件`);
  console.log(`正常: ${skippedCount}件`);
  console.log('\n⚠️ 注意: このスクリプトは確認モードで実行されています');
  console.log('実際に修正するには、コード内のコメントを外してください');
}

// スクリプトを実行
fixLifetimeExpiration().catch(console.error);

