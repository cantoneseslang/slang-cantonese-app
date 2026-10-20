import { test, expect, chromium, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  device: 'desktop' | 'mobile';
  sessionId: string;
  events: any[];
  finalTexts: string[];
  errors: any[];
  startTime: Date;
  endTime: Date;
}

// セッションIDを取得する関数
async function getLatestSessionId(deviceType: 'mobile' | 'desktop', timeout: number = 10000): Promise<string | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const { data, error } = await supabase
      .from('speech_recognition_logs')
      .select('session_id')
      .eq('device_info->>is_mobile', deviceType === 'mobile' ? 'true' : 'false')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data && !error) {
      return data.session_id;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return null;
}

// セッションのログを取得する関数
async function getSessionLogs(sessionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('speech_recognition_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`ログ取得エラー: ${error.message}`);
  }
  
  return data || [];
}

// テスト用の認証状態を設定（ログインをバイパス）
async function setupTestAuth(page: any) {
  // PlaywrightのUser-Agentで自動的にテストモードとして認識される
  // 追加のヘッダーは不要（PlaywrightのUser-Agentで検出される）
}

// 隠しモードを起動する関数（タイトルを3回クリック）
async function activateHiddenMode(page: any) {
  // タイトルを探す（複数のh1がある可能性があるので、最初のものを探す）
  const title = page.locator('h1').first();
  
  // タイトルが見つかるまで待機
  await title.waitFor({ state: 'visible', timeout: 10000 });
  
  if (await title.count() > 0) {
    console.log('タイトルを3回クリックして隠しモードを起動...');
    for (let i = 0; i < 3; i++) {
      await title.click();
      await page.waitForTimeout(300);
    }
    // 隠しモードが起動するまで待機
    await page.waitForTimeout(2000);
    
    // 隠しモードが起動したか確認（マイクボタンが表示されるまで待機）
    const micButton = page.locator('img[src*="mic-yue-to-ja"], img[src*="volume-logo"]').first();
    await micButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ 隠しモードが起動しました');
  } else {
    throw new Error('タイトルが見つかりません');
  }
}

// マイクボタンを長押しする関数（デスクトップ用）
async function pressMicButtonDesktop(page: any, duration: number = 3000) {
  // マイクボタンを探す（ロゴマーク）
  const micButton = page.locator('img[src*="mic-yue-to-ja"], img[src*="volume-logo"]').first();
  
  if (await micButton.count() === 0) {
    throw new Error('マイクボタンが見つかりません');
  }
  
  const box = await micButton.boundingBox();
  if (!box) {
    throw new Error('マイクボタンの位置が取得できません');
  }
  
  // 長押し開始
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  
  // 指定時間待機
  await page.waitForTimeout(duration);
  
  // 長押し終了
  await page.mouse.up();
  
  // 処理が完了するまで待機
  await page.waitForTimeout(1000);
}

// マイクボタンを長押しする関数（モバイル用）
async function pressMicButtonMobile(page: any, duration: number = 3000) {
  // マイクボタンを探す（ロゴマーク）
  const micButton = page.locator('img[src*="mic-yue-to-ja"], img[src*="volume-logo"]').first();
  
  if (await micButton.count() === 0) {
    throw new Error('マイクボタンが見つかりません');
  }
  
  const box = await micButton.boundingBox();
  if (!box) {
    throw new Error('マイクボタンの位置が取得できません');
  }
  
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  
  // タッチ開始（touchstart）
  await page.evaluate(({ x, y }) => {
    const touch = new Touch({
      identifier: Date.now(),
      target: document.elementFromPoint(x, y)!,
      clientX: x,
      clientY: y,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 10,
      force: 0.5,
    });
    const touchEvent = new TouchEvent('touchstart', {
      cancelable: true,
      bubbles: true,
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
    });
    document.elementFromPoint(x, y)?.dispatchEvent(touchEvent);
  }, { x: centerX, y: centerY });
  
  // 指定時間待機（長押し）
  await page.waitForTimeout(duration);
  
  // タッチ終了（touchend）
  await page.evaluate(({ x, y }) => {
    const touch = new Touch({
      identifier: Date.now(),
      target: document.elementFromPoint(x, y)!,
      clientX: x,
      clientY: y,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 10,
      force: 0.5,
    });
    const touchEvent = new TouchEvent('touchend', {
      cancelable: true,
      bubbles: true,
      touches: [],
      targetTouches: [],
      changedTouches: [touch],
    });
    document.elementFromPoint(x, y)?.dispatchEvent(touchEvent);
  }, { x: centerX, y: centerY });
  
  // 処理が完了するまで待機
  await page.waitForTimeout(1000);
}

test.describe('音声認識 E2Eテスト', () => {
  test('PC版とモバイル版で同じ操作を実行して比較', async () => {
    const testResults: TestResult[] = [];
    const testPhrase = 'こんにちは、これはテストです';
    
    // PC版のテスト
    const desktopContext = await chromium.launch({
      headless: false, // デバッグ用にheadlessをfalseに
    });
    const desktopPage = await desktopContext.newPage({
      viewport: { width: 1920, height: 1080 }
    });
    
    try {
      console.log('🖥️  PC版のテストを開始...');
      
      // ページにアクセス（PlaywrightのUser-Agentで自動的に認証がスキップされる）
      await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // ページが完全に読み込まれるまで待機
      await desktopPage.waitForLoadState('domcontentloaded');
      await desktopPage.waitForTimeout(1000);
      
      // 隠しモードを起動
      await activateHiddenMode(desktopPage);
      
      // マイクボタンを長押し（3秒）
      await pressMicButtonDesktop(desktopPage, 3000);
      
      // セッションIDを取得
      const desktopSessionId = await getLatestSessionId('desktop', 15000);
      
      if (desktopSessionId) {
        const logs = await getSessionLogs(desktopSessionId);
        const finalTexts = logs
          .filter(log => log.event_type === 'result' && log.transcript_data?.final)
          .map(log => log.transcript_data.final);
        const errors = logs.filter(log => log.event_type === 'error');
        
        testResults.push({
          device: 'desktop',
          sessionId: desktopSessionId,
          events: logs,
          finalTexts,
          errors,
          startTime: new Date(logs[0]?.created_at || new Date()),
          endTime: new Date(logs[logs.length - 1]?.created_at || new Date())
        });
        
        console.log(`✅ PC版: セッション ${desktopSessionId}`);
        console.log(`   確定テキスト: ${finalTexts.join(', ')}`);
        console.log(`   エラー数: ${errors.length}`);
      } else {
        console.error('❌ PC版: セッションIDが取得できませんでした');
      }
      
      await desktopPage.waitForTimeout(2000);
    } finally {
      await desktopContext.close();
    }
    
    // モバイル版のテスト
    const mobileContext = await chromium.launch({
      headless: false,
    });
    const mobileDevice = devices['iPhone 13'];
    const mobilePage = await mobileContext.newPage({
      ...mobileDevice,
      viewport: { width: 390, height: 844 }
    });
    
    try {
      console.log('📱 モバイル版のテストを開始...');
      
      // ページにアクセス（PlaywrightのUser-Agentで自動的に認証がスキップされる）
      await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      // ページが完全に読み込まれるまで待機
      await mobilePage.waitForLoadState('domcontentloaded');
      await mobilePage.waitForTimeout(1000);
      
      // 隠しモードを起動
      await activateHiddenMode(mobilePage);
      
      // マイクボタンを長押し（3秒）- タッチイベントを使用
      await pressMicButtonMobile(mobilePage, 3000);
      
      // セッションIDを取得
      const mobileSessionId = await getLatestSessionId('mobile', 15000);
      
      if (mobileSessionId) {
        const logs = await getSessionLogs(mobileSessionId);
        const finalTexts = logs
          .filter(log => log.event_type === 'result' && log.transcript_data?.final)
          .map(log => log.transcript_data.final);
        const errors = logs.filter(log => log.event_type === 'error');
        
        testResults.push({
          device: 'mobile',
          sessionId: mobileSessionId,
          events: logs,
          finalTexts,
          errors,
          startTime: new Date(logs[0]?.created_at || new Date()),
          endTime: new Date(logs[logs.length - 1]?.created_at || new Date())
        });
        
        console.log(`✅ モバイル版: セッション ${mobileSessionId}`);
        console.log(`   確定テキスト: ${finalTexts.join(', ')}`);
        console.log(`   エラー数: ${errors.length}`);
      } else {
        console.error('❌ モバイル版: セッションIDが取得できませんでした');
      }
      
      await mobilePage.waitForTimeout(2000);
    } finally {
      await mobileContext.close();
    }
    
    // 結果を比較
    console.log('\n📊 テスト結果の比較\n');
    console.log('='.repeat(80));
    
    if (testResults.length === 2) {
      const desktop = testResults.find(r => r.device === 'desktop')!;
      const mobile = testResults.find(r => r.device === 'mobile')!;
      
      console.log(`🖥️  PC版:`);
      console.log(`   セッションID: ${desktop.sessionId}`);
      console.log(`   イベント数: ${desktop.events.length}`);
      console.log(`   確定テキスト数: ${desktop.finalTexts.length}`);
      console.log(`   確定テキスト: ${desktop.finalTexts.join(', ') || '(なし)'}`);
      console.log(`   エラー数: ${desktop.errors.length}`);
      if (desktop.errors.length > 0) {
        desktop.errors.forEach(err => {
          console.log(`     - ${err.error_details?.error}: ${err.error_details?.message}`);
        });
      }
      
      console.log(`\n📱 モバイル版:`);
      console.log(`   セッションID: ${mobile.sessionId}`);
      console.log(`   イベント数: ${mobile.events.length}`);
      console.log(`   確定テキスト数: ${mobile.finalTexts.length}`);
      console.log(`   確定テキスト: ${mobile.finalTexts.join(', ') || '(なし)'}`);
      console.log(`   エラー数: ${mobile.errors.length}`);
      if (mobile.errors.length > 0) {
        mobile.errors.forEach(err => {
          console.log(`     - ${err.error_details?.error}: ${err.error_details?.message}`);
        });
      }
      
      console.log(`\n🔍 比較結果:`);
      console.log(`   確定テキスト数の差: ${Math.abs(desktop.finalTexts.length - mobile.finalTexts.length)}`);
      console.log(`   エラー数の差: ${Math.abs(desktop.errors.length - mobile.errors.length)}`);
      
      // アサーション
      expect(desktop.finalTexts.length).toBeGreaterThan(0);
      expect(mobile.finalTexts.length).toBeGreaterThan(0);
      
      // エラーがないことを確認
      expect(desktop.errors.length).toBe(0);
      expect(mobile.errors.length).toBe(0);
    } else {
      console.error('❌ テスト結果が不完全です');
      expect(testResults.length).toBe(2);
    }
    
    console.log('='.repeat(80));
  });
});

