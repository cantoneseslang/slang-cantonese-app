/**
 * ⚠️ 重要：このファイルは重要なページコンテンツを含みます
 * 
 * このファイルは意図しない変更を防ぐため保護されています。
 * マージや自動修正時には注意が必要です。
 * 
 * 変更する場合は必ず以下を確認してください：
 * - 変更内容が正しいか
 * - 他のページとの整合性が保たれているか
 * - 過去のコミット履歴で意図しない変更が入っていないか
 * 
 * このファイルを簡易版に戻したり、内容を削除しないでください。
 */

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


