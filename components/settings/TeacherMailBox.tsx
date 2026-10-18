'use client';

import { useEffect, useRef, useState } from 'react';

type MailUser = { id?: string; email?: string; user_metadata?: { username?: string } } | null;

export default function TeacherMailBox({ user }: { user: MailUser }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; body: string; direction: 'user' | 'staff'; created_at: string }>>([]);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    fetch('/api/support-messages')
      .then((response) => response.json())
      .then((data) => {
        if (active && data.success) setMessages(data.messages || []);
      })
      .catch(() => {
        if (active) setNotice('これまでの連絡を読み込めませんでした');
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const send = async () => {
    const message = draft.trim();
    if (!message || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setNotice('');
    try {
      const response = await fetch('/api/support-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setNoticeOk(false);
        setNotice(data.error || '送信できませんでした');
        return;
      }
      if (data.message) setMessages((current) => [...current, data.message]);
      setDraft('');
      setNoticeOk(data.mailed !== false);
      setNotice(data.mailed === false ? (data.error || '画面には残りましたが、メールは届いていません') : '送信しました。');
    } catch {
      setNoticeOk(false);
      setNotice('送信できませんでした');
    } finally {
      sendingRef.current = false;
      setSending(false);
      requestAnimationFrame(() => noticeRef.current?.scrollIntoView({ block: 'nearest' }));
    }
  };

  return (
    <div
      style={{ margin: '8px 0 4px' }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
        スラング先生にメールする
      </label>
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8, maxHeight: 180, overflowY: 'auto' }}>
          {messages.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: item.direction === 'staff' ? '#eff6ff' : '#f9fafb',
                border: `1px solid ${item.direction === 'staff' ? '#bfdbfe' : '#e5e7eb'}`,
                color: '#1f2937',
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: item.direction === 'staff' ? '#1d4ed8' : '#6b7280', marginBottom: 2 }}>
                {item.direction === 'staff' ? 'スラング先生' : 'あなた'}
              </div>
              {item.body}
            </div>
          ))}
        </div>
      )}
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="スラング先生へのメッセージ"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 10px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: '16px',
          lineHeight: 1.5,
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void send();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        disabled={sending || draft.trim().length === 0}
        style={{
          marginTop: 6,
          width: '100%',
          height: 36,
          backgroundColor: sending || draft.trim().length === 0 ? '#93c5fd' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: sending || draft.trim().length === 0 ? 'default' : 'pointer',
        }}
      >
        {sending ? '送信中...' : '送信'}
      </button>
      {notice && (
        <div
          ref={noticeRef}
          style={{
            marginTop: 8,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: noticeOk ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${noticeOk ? '#86efac' : '#fecaca'}`,
            color: noticeOk ? '#166534' : '#991b1b',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
