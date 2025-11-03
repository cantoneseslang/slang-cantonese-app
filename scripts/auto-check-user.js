#!/usr/bin/env node

/**
 * ユーザーデータ自動確認スクリプト
 * 開発サーバーが起動している必要があります
 */

const http = require('http');

const DEV_URL = 'http://localhost:3000';
const API_PATH = '/api/debug-user';

async function checkUserData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: API_PATH,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('タイムアウト: 開発サーバーが起動していません'));
    });

    req.end();
  });
}

async function main() {
  console.log('\n🔍 ユーザーデータ自動確認中...\n');
  
  try {
    const result = await checkUserData();
    
    if (result.status === 401) {
      console.log('⚠️  ログインが必要です');
      console.log('   1. ブラウザで http://localhost:3000 を開く');
      console.log('   2. ログインする');
      console.log('   3. このスクリプトを再度実行\n');
      console.log('   または、ブラウザで以下にアクセス:');
      console.log(`   ${DEV_URL}${API_PATH}\n`);
      process.exit(1);
    }
    
    if (result.status !== 200) {
      console.error('❌ エラー:', result.data);
      process.exit(1);
    }
    
    const userData = result.data.user;
    
    console.log('✅ Supabaseデータ確認結果:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`👤 User ID: ${userData.id}`);
    console.log(`📝 Username: ${userData.username || '❌ 未設定'}`);
    console.log(`💎 Membership: ${userData.membership_type || '❌ 未設定'}`);
    console.log(`🔑 Has Password: ${userData.has_password ? '✅ 設定済み' : '❌ 未設定'}`);
    console.log(`📅 Last Sign In: ${userData.last_sign_in_at || '❌ 未設定'}`);
    console.log(`🔄 Updated At: ${userData.updated_at || '❌ 未設定'}`);
    console.log(`📅 Created At: ${userData.created_at || '❌ 未設定'}`);
    console.log(`🔐 Session: ${userData.has_session ? '✅ アクティブ' : '❌ なし'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 問題チェック
    const issues = [];
    if (!userData.username) issues.push('⚠️  Usernameが未設定');
    if (!userData.membership_type) issues.push('⚠️  Membership Typeが未設定');
    if (!userData.has_password) issues.push('⚠️  パスワードが未設定');
    
    if (issues.length > 0) {
      console.log('📋 発見された問題:\n');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    } else {
      console.log('✅ すべてのデータが正しく設定されています！\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error.message);
    if (error.message.includes('タイムアウト') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 開発サーバーを起動してください:');
      console.error('   npm run dev\n');
    }
    process.exit(1);
  }
}

main();



