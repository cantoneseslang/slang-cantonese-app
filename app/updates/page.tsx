export default function UpdatesPage() {
  const updates = [
    {
      date: '2025/11/01',
      title: '大型アップデート: Vercel に移行',
      content: '広東語万能辞書をVercelプラットフォームに移行し、パフォーマンスと安定性を向上させました。'
    },
    {
      date: '2024/11/01',
      title: 'GAS での「広東語万能辞書」として提供',
      content: 'Google Apps Script上で「広東語万能辞書」としてサービスを開始しました。'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>更新情報</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
        {updates.map((update, index) => (
          <div
            key={index}
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              {update.date}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {update.title}
            </h2>
            <p style={{ color: '#374151' }}>{update.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

