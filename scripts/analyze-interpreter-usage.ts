#!/usr/bin/env tsx
/**
 * 通訳機能の使用状況を分析するスクリプト
 * 
 * 使用方法:
 *   npm run analyze-interpreter-usage              # 全体の分析
 *   npm run analyze-interpreter-usage -- --user   # ユーザー別の詳細分析
 *   npm run analyze-interpreter-usage -- --daily  # 日別の使用状況
 *   npm run analyze-interpreter-usage -- --hourly # 時間帯別の使用状況
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// .env.localから環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface InterpreterUsage {
  id: string;
  user_id: string;
  language: 'cantonese' | 'mandarin';
  created_at: string;
}

interface UserMembership {
  user_id: string;
  email?: string;
  membership_type: string;
}

async function getUserMemberships(userIds: string[]): Promise<Map<string, UserMembership>> {
  const memberships = new Map<string, UserMembership>();
  
  // ユーザー情報を取得（Service Role Keyを使用）
  for (const userId of userIds) {
    try {
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
      if (!error && user) {
        const membershipType = user.user_metadata?.membership_type || 
                              user.app_metadata?.membership_type || 
                              'free';
        memberships.set(userId, {
          user_id: userId,
          email: user.email,
          membership_type: membershipType
        });
      }
    } catch (error) {
      console.warn(`⚠️ ユーザー ${userId} の情報取得に失敗:`, error);
    }
  }
  
  return memberships;
}

async function analyzeOverall() {
  console.log('\n📊 通訳機能使用状況の全体分析\n');
  
  // 全体統計
  const { count: totalCount, error: countError } = await supabase
    .from('interpreter_usage')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ エラー:', countError);
    return;
  }
  
  console.log(`総使用回数: ${totalCount}回\n`);
  
  // 言語別統計
  const { data: languageData, error: languageError } = await supabase
    .from('interpreter_usage')
    .select('language')
    .order('created_at', { ascending: false });
  
  if (languageError) {
    console.error('❌ エラー:', languageError);
    return;
  }
  
  const cantoneseCount = languageData?.filter(d => d.language === 'cantonese').length || 0;
  const mandarinCount = languageData?.filter(d => d.language === 'mandarin').length || 0;
  
  console.log('言語別の使用回数:');
  console.log(`  カントン語: ${cantoneseCount}回 (${((cantoneseCount / (totalCount || 1)) * 100).toFixed(1)}%)`);
  console.log(`  中国語: ${mandarinCount}回 (${((mandarinCount / (totalCount || 1)) * 100).toFixed(1)}%)\n`);
  
  // ユーザー数
  const { data: userData, error: userError } = await supabase
    .from('interpreter_usage')
    .select('user_id')
    .order('created_at', { ascending: false });
  
  if (userError) {
    console.error('❌ エラー:', userError);
    return;
  }
  
  const uniqueUsers = new Set(userData?.map(d => d.user_id) || []);
  console.log(`ユーザー数: ${uniqueUsers.size}人\n`);
  
  // ユーザー別の使用回数
  const userUsageMap = new Map<string, number>();
  userData?.forEach(d => {
    userUsageMap.set(d.user_id, (userUsageMap.get(d.user_id) || 0) + 1);
  });
  
  const sortedUsers = Array.from(userUsageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('上位10ユーザーの使用回数:');
  const userIds = sortedUsers.map(([userId]) => userId);
  const memberships = await getUserMemberships(userIds);
  
  for (const [userId, count] of sortedUsers) {
    const membership = memberships.get(userId);
    const membershipType = membership?.membership_type || 'free';
    const email = membership?.email || 'N/A';
    console.log(`  ${count}回 - ${email} (${membershipType})`);
  }
}

async function analyzeByUser() {
  console.log('\n👥 ユーザー別の詳細分析\n');
  
  const { data: usageData, error } = await supabase
    .from('interpreter_usage')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ エラー:', error);
    return;
  }
  
  // ユーザーごとにグループ化
  const userGroups = new Map<string, InterpreterUsage[]>();
  usageData?.forEach(usage => {
    if (!userGroups.has(usage.user_id)) {
      userGroups.set(usage.user_id, []);
    }
    userGroups.get(usage.user_id)!.push(usage);
  });
  
  // ユーザー情報を取得
  const userIds = Array.from(userGroups.keys());
  const memberships = await getUserMemberships(userIds);
  
  // ユーザーごとの統計を計算
  const userStats = Array.from(userGroups.entries()).map(([userId, usages]) => {
    const cantoneseCount = usages.filter(u => u.language === 'cantonese').length;
    const mandarinCount = usages.filter(u => u.language === 'mandarin').length;
    const firstUsage = usages[usages.length - 1]?.created_at;
    const lastUsage = usages[0]?.created_at;
    
    // 使用日数を計算
    const usageDates = new Set(usages.map(u => u.created_at.split('T')[0]));
    const daysUsed = usageDates.size;
    const avgUsagePerDay = usages.length / daysUsed;
    
    return {
      userId,
      totalUsage: usages.length,
      cantoneseCount,
      mandarinCount,
      firstUsage,
      lastUsage,
      daysUsed,
      avgUsagePerDay,
      membership: memberships.get(userId)
    };
  }).sort((a, b) => b.totalUsage - a.totalUsage);
  
  console.log('ユーザー別の使用状況:\n');
  for (const stat of userStats) {
    const membership = stat.membership;
    const email = membership?.email || 'N/A';
    const membershipType = membership?.membership_type || 'free';
    
    console.log(`📧 ${email} (${membershipType})`);
    console.log(`   総使用回数: ${stat.totalUsage}回`);
    console.log(`   カントン語: ${stat.cantoneseCount}回`);
    console.log(`   中国語: ${stat.mandarinCount}回`);
    console.log(`   使用日数: ${stat.daysUsed}日`);
    console.log(`   1日あたりの平均: ${stat.avgUsagePerDay.toFixed(2)}回`);
    console.log(`   初回使用: ${new Date(stat.firstUsage).toLocaleString('ja-JP')}`);
    console.log(`   最終使用: ${new Date(stat.lastUsage).toLocaleString('ja-JP')}`);
    console.log('');
  }
}

async function analyzeDaily() {
  console.log('\n📅 日別の使用状況（最近30日）\n');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: usageData, error } = await supabase
    .from('interpreter_usage')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ エラー:', error);
    return;
  }
  
  // 日別にグループ化
  const dailyGroups = new Map<string, InterpreterUsage[]>();
  usageData?.forEach(usage => {
    const date = usage.created_at.split('T')[0];
    if (!dailyGroups.has(date)) {
      dailyGroups.set(date, []);
    }
    dailyGroups.get(date)!.push(usage);
  });
  
  // 日付順にソート
  const sortedDays = Array.from(dailyGroups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);
  
  console.log('日別の使用回数:\n');
  for (const [date, usages] of sortedDays) {
    const cantoneseCount = usages.filter(u => u.language === 'cantonese').length;
    const mandarinCount = usages.filter(u => u.language === 'mandarin').length;
    const uniqueUsers = new Set(usages.map(u => u.user_id)).size;
    
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ja-JP', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
    
    console.log(`${formattedDate}: ${usages.length}回 (カントン語: ${cantoneseCount}, 中国語: ${mandarinCount}, ユーザー: ${uniqueUsers}人)`);
  }
  
  // 統計
  const totalDays = sortedDays.length;
  const totalUsage = usageData?.length || 0;
  const avgUsagePerDay = totalUsage / totalDays;
  
  console.log(`\n平均使用回数/日: ${avgUsagePerDay.toFixed(2)}回`);
}

async function analyzeHourly() {
  console.log('\n⏰ 時間帯別の使用状況\n');
  
  const { data: usageData, error } = await supabase
    .from('interpreter_usage')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ エラー:', error);
    return;
  }
  
  // 時間帯別にグループ化
  const hourlyGroups = new Map<number, InterpreterUsage[]>();
  usageData?.forEach(usage => {
    const date = new Date(usage.created_at);
    const hour = date.getHours();
    if (!hourlyGroups.has(hour)) {
      hourlyGroups.set(hour, []);
    }
    hourlyGroups.get(hour)!.push(usage);
  });
  
  // 時間順にソート
  const sortedHours = Array.from(hourlyGroups.entries())
    .sort((a, b) => a[0] - b[0]);
  
  console.log('時間帯別の使用回数:\n');
  for (const [hour, usages] of sortedHours) {
    const barLength = Math.round((usages.length / (usageData?.length || 1)) * 50);
    const bar = '█'.repeat(barLength);
    console.log(`${hour.toString().padStart(2, '0')}:00 - ${usages.length.toString().padStart(3)}回 ${bar}`);
  }
  
  // ピーク時間帯を特定
  const peakHour = sortedHours.reduce((max, [hour, usages]) => 
    usages.length > max.count ? { hour, count: usages.length } : max,
    { hour: 0, count: 0 }
  );
  
  console.log(`\nピーク時間帯: ${peakHour.hour}:00 (${peakHour.count}回)`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--user')) {
    await analyzeByUser();
  } else if (args.includes('--daily')) {
    await analyzeDaily();
  } else if (args.includes('--hourly')) {
    await analyzeHourly();
  } else {
    await analyzeOverall();
    console.log('\n---\n');
    await analyzeDaily();
    console.log('\n---\n');
    await analyzeHourly();
  }
}

main().catch(console.error);

