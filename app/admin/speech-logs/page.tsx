'use client';

import { useState, useEffect } from 'react';

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

export default function SpeechLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.set('device_type', filter);
      const response = await fetch(`/api/speech-recognition-logs?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || '読み込めませんでした');
      setLogs(data.data || []);
    } catch (error) {
      console.error('ログ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000); // 3秒ごとに更新
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter]);

  const formatLog = (log: LogEntry) => {
    const isMobile = log.device_info?.is_mobile === true || log.device_info?.is_mobile === 'true';
    const device = isMobile ? '📱 モバイル' : '💻 PC';
    const browser = log.browser_info?.name || 'Unknown';
    const time = new Date(log.created_at).toLocaleString('ja-JP');

    return {
      device,
      browser,
      time,
      eventType: log.event_type,
      finalText: log.transcript_data?.final || '',
      interimText: log.transcript_data?.interim || '',
      error: log.error_details?.error || '',
      sessionId: log.session_id
    };
  };

  // セッションごとにグループ化
  const sessions = new Map<string, LogEntry[]>();
  logs.forEach(log => {
    if (!sessions.has(log.session_id)) {
      sessions.set(log.session_id, []);
    }
    sessions.get(log.session_id)!.push(log);
  });

  const sessionArray = Array.from(sessions.entries()).map(([sessionId, sessionLogs]) => ({
    sessionId,
    logs: sessionLogs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    deviceType: sessionLogs[0]?.device_info?.is_mobile === true || sessionLogs[0]?.device_info?.is_mobile === 'true' ? 'mobile' : 'desktop'
  }));

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>ログを読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        音声認識ログ監視
      </h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'mobile' | 'desktop')}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        >
          <option value="all">すべて</option>
          <option value="mobile">モバイルのみ</option>
          <option value="desktop">PCのみ</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>自動更新（3秒ごと）</span>
        </label>

        <button
          onClick={fetchLogs}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          更新
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p>総ログ数: {logs.length}件 | セッション数: {sessionArray.length}件</p>
      </div>

      {sessionArray.length === 0 ? (
        <p>ログが見つかりませんでした</p>
      ) : (
        sessionArray.map(({ sessionId, logs: sessionLogs, deviceType }) => {
          const firstLog = formatLog(sessionLogs[0]);
          const results = sessionLogs.filter(log => log.event_type === 'result' && log.transcript_data?.final);
          const errors = sessionLogs.filter(log => log.event_type === 'error');

          return (
            <div
              key={sessionId}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: deviceType === 'mobile' ? '#fef3c7' : '#dbeafe'
              }}
            >
              <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {firstLog.device} | {firstLog.browser} | セッション: {sessionId.substring(0, 20)}...
              </div>

              <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                開始時刻: {firstLog.time} | イベント数: {sessionLogs.length} | 
                結果: {results.length}件 | エラー: {errors.length}件
              </div>

              {results.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>✅ 確定テキスト:</div>
                  {results.map((log, idx) => (
                    <div key={idx} style={{ marginLeft: '1rem', marginBottom: '0.25rem' }}>
                      {log.transcript_data?.final}
                    </div>
                  ))}
                </div>
              )}

              {errors.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>❌ エラー:</div>
                  {errors.map((log, idx) => (
                    <div key={idx} style={{ marginLeft: '1rem', marginBottom: '0.25rem' }}>
                      {log.error_details?.error} - {log.error_details?.message}
                    </div>
                  ))}
                </div>
              )}

              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', color: '#3b82f6' }}>詳細ログを見る</summary>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  {sessionLogs.map((log, idx) => {
                    const formatted = formatLog(log);
                    return (
                      <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{formatted.eventType} - {formatted.time}</div>
                        {formatted.finalText && <div>確定: {formatted.finalText}</div>}
                        {formatted.interimText && <div>中間: {formatted.interimText}</div>}
                        {formatted.error && <div style={{ color: 'red' }}>エラー: {formatted.error}</div>}
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          );
        })
      )}
    </div>
  );
}

