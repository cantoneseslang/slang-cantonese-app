#!/usr/bin/env node

/**
 * Supabase設定の自動チェックスクリプト
 * プロジェクト固有の.env.localとMCP設定の整合性を確認
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_LOCAL = path.join(PROJECT_ROOT, '.env.local');
const MCP_CONFIG = path.join(require('os').homedir(), '.cursor', 'mcp.json');

// .env.localからプロジェクトIDを抽出
function getProjectIdFromEnv() {
  if (!fs.existsSync(ENV_LOCAL)) {
    console.error('❌ .env.localが見つかりません');
    return null;
  }

  const envContent = fs.readFileSync(ENV_LOCAL, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
  
  if (!urlMatch) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URLが見つかりません');
    return null;
  }

  return urlMatch[1];
}

// MCP設定からプロジェクトIDを抽出
function getProjectIdFromMCP() {
  if (!fs.existsSync(MCP_CONFIG)) {
    console.error('❌ MCP設定ファイルが見つかりません');
    return null;
  }

  try {
    const mcpContent = JSON.parse(fs.readFileSync(MCP_CONFIG, 'utf8'));
    const supabaseUrl = mcpContent?.mcpServers?.supabase?.url;
    
    if (!supabaseUrl) {
      console.error('❌ MCP設定にsupabase URLが見つかりません');
      return null;
    }

    const match = supabaseUrl.match(/project_ref=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('❌ MCP設定の読み込みエラー:', error.message);
    return null;
  }
}

// メイン処理
function main() {
  console.log('\n🔍 Supabase設定チェック中...\n');

  const envProjectId = getProjectIdFromEnv();
  const mcpProjectId = getProjectIdFromMCP();

  if (!envProjectId || !mcpProjectId) {
    console.error('設定ファイルの読み込みに失敗しました');
    process.exit(1);
  }

  console.log(`📦 プロジェクト固有設定 (.env.local): ${envProjectId}`);
  console.log(`⚙️  MCP設定 (~/.cursor/mcp.json): ${mcpProjectId}\n`);

  if (envProjectId === mcpProjectId) {
    console.log('✅ 設定は一致しています！');
    process.exit(0);
  } else {
    console.error('❌ 警告: プロジェクトIDが一致しません！');
    console.error(`   正しいプロジェクトID: ${envProjectId}`);
    console.error(`   MCP設定を更新する必要があります。\n`);
    console.error(`   修正方法:`);
    console.error(`   1. ~/.cursor/mcp.json を開く`);
    console.error(`   2. supabase の url を以下に変更:`);
    console.error(`      "url": "https://mcp.supabase.com/mcp?project_ref=${envProjectId}"`);
    console.error(`   3. Cursorを再起動する\n`);
    process.exit(1);
  }
}

main();


