#!/usr/bin/env tsx
/**
 * 音声認識ログを確認するスクリプト
 * 
 * 使用方法:
 *   npm run check-speech-logs              # 最新50件のログを表示
 *   npm run check-speech-logs -- --mobile  # モバイルのログのみ
 *   npm run check-speech-logs -- --desktop # PCのログのみ
 *   npm run check-speech-logs -- --session <session_id> # 特定のセッション
 *   npm run check-speech-logs -- --compare # PCとモバイルを比較
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// .env.localから環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface LogEntry {
  id: string;
  event_type: string;
  device_info: any;
  browser_info: any;
  recognition_state: any;
  error_details: any;
  transcript_data: any;
  session_id: string;
  created_at: string;
}

function formatLog(log: LogEntry) {
  const isMobile = log.device_info?.is_mobile === true || log.device_info?.is_mobile === 'true';
  const device = isMobile ? '📱 モバイル' : '💻 PC';
  const browser = log.browser_info?.name || 'Unknown';
  const time = new Date(log.created_at).toLocaleString('ja-JP');
  
  let output = `\n${'='.repeat(80)}\n`;
  output += `${device} | ${browser} | ${log.event_type} | ${time}\n`;
  output += `${'='.repeat(80)}\n`;
  
  if (log.transcript_data) {
    if (log.transcript_data.final) {
      output += `✅ 確定テキスト: ${log.transcript_data.final}\n`;
    }
    if (log.transcript_data.interim) {
      output += `⏳ 中間テキスト: ${log.transcript_data.interim}\n`;
    }
    if (log.transcript_data.result_index !== undefined) {
      output += `📊 resultIndex: ${log.transcript_data.result_index}, resultsLength: ${log.transcript_data.results_length}\n`;
    }
  }
  
  if (log.error_details) {
    output += `❌ エラー: ${log.error_details.error}\n`;
    if (log.error_details.error_code) {
      output += `   エラーコード: ${log.error_details.error_code}\n`;
    }
    if (log.error_details.message) {
      output += `   メッセージ: ${log.error_details.message}\n`;
    }
  }
  
  if (log.recognition_state) {
    output += `⚙️  設定: continuous=${log.recognition_state.continuous}, interim_results=${log.recognition_state.interim_results}, lang=${log.recognition_state.lang}\n`;
  }
  
  output += `🔗 セッションID: ${log.session_id}\n`;
  
  return output;
}

async function getLogs(options: {
  deviceType?: 'mobile' | 'desktop';
  sessionId?: string;
  limit?: number;
}) {
  let query = supabase
    .from('speech_recognition_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options.limit || 50);

  if (options.deviceType) {
    const isMobile = options.deviceType === 'mobile';
    query = query.eq('device_info->>is_mobile', String(isMobile));
  }

  if (options.sessionId) {
    query = query.eq('session_id', options.sessionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }

  return data as LogEntry[];
}

async function compareMobileVsDesktop() {
  console.log('\n📊 PCとモバイルの比較\n');
  
  const [mobileLogs, desktopLogs] = await Promise.all([
    getLogs({ deviceType: 'mobile', limit: 20 }),
    getLogs({ deviceType: 'desktop', limit: 20 })
  ]);

  console.log(`\n📱 モバイル: ${mobileLogs.length}件`);
  console.log(`💻 PC: ${desktopLogs.length}件\n`);

  // セッションごとにグループ化
  const mobileSessions = new Map<string, LogEntry[]>();
  const desktopSessions = new Map<string, LogEntry[]>();

  mobileLogs.forEach(log => {
    if (!mobileSessions.has(log.session_id)) {
      mobileSessions.set(log.session_id, []);
    }
    mobileSessions.get(log.session_id)!.push(log);
  });

  desktopLogs.forEach(log => {
    if (!desktopSessions.has(log.session_id)) {
      desktopSessions.set(log.session_id, []);
    }
    desktopSessions.get(log.session_id)!.push(log);
  });

  console.log(`\n📱 モバイルセッション数: ${mobileSessions.size}`);
  console.log(`💻 PCセッション数: ${desktopSessions.size}\n`);

  // 最新のセッションを比較
  const latestMobileSession = Array.from(mobileSessions.values())[0] || [];
  const latestDesktopSession = Array.from(desktopSessions.values())[0] || [];

  if (latestMobileSession.length > 0) {
    console.log('\n📱 最新のモバイルセッション:');
    latestMobileSession
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(log => console.log(formatLog(log)));
  }

  if (latestDesktopSession.length > 0) {
    console.log('\n💻 最新のPCセッション:');
    latestDesktopSession
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(log => console.log(formatLog(log)));
  }

  // 結果イベントの比較
  const mobileResults = mobileLogs.filter(log => log.event_type === 'result' && log.transcript_data?.final);
  const desktopResults = desktopLogs.filter(log => log.event_type === 'result' && log.transcript_data?.final);

  console.log(`\n📊 結果イベント比較:`);
  console.log(`📱 モバイル: ${mobileResults.length}件`);
  console.log(`💻 PC: ${desktopResults.length}件\n`);

  if (mobileResults.length > 0) {
    console.log('📱 モバイルの確定テキスト:');
    mobileResults.slice(0, 5).forEach(log => {
      console.log(`  - ${log.transcript_data.final}`);
    });
  }

  if (desktopResults.length > 0) {
    console.log('\n💻 PCの確定テキスト:');
    desktopResults.slice(0, 5).forEach(log => {
      console.log(`  - ${log.transcript_data.final}`);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--compare')) {
    await compareMobileVsDesktop();
    return;
  }

  const mobileIndex = args.indexOf('--mobile');
  const desktopIndex = args.indexOf('--desktop');
  const sessionIndex = args.indexOf('--session');
  
  const deviceType = mobileIndex !== -1 ? 'mobile' : desktopIndex !== -1 ? 'desktop' : undefined;
  const sessionId = sessionIndex !== -1 ? args[sessionIndex + 1] : undefined;

  const logs = await getLogs({ deviceType, sessionId, limit: 50 });

  if (logs.length === 0) {
    console.log('📭 ログが見つかりませんでした');
    return;
  }

  console.log(`\n📋 ログ ${logs.length}件を表示します\n`);

  // セッションごとにグループ化して表示
  const sessions = new Map<string, LogEntry[]>();
  logs.forEach(log => {
    if (!sessions.has(log.session_id)) {
      sessions.set(log.session_id, []);
    }
    sessions.get(log.session_id)!.push(log);
  });

  Array.from(sessions.entries()).forEach(([sessionId, sessionLogs]) => {
    console.log(`\n🔗 セッション: ${sessionId}`);
    sessionLogs
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(log => console.log(formatLog(log)));
  });
}

main().catch(console.error);

