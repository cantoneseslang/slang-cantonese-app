export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>プライバシーポリシー</h1>
      <p style={{ marginBottom: '1rem', color: '#374151' }}>
        当サービスは、ユーザーの個人情報を適切に取り扱い、目的の範囲内で安全に管理します。
      </p>
      <ul style={{ paddingLeft: '1.25rem', color: '#374151', display: 'grid', gap: 6 }}>
        <li>収集する情報：メールアドレス、操作ログ等（必要最小限）</li>
        <li>利用目的：サービス提供、品質向上、お問い合わせ対応</li>
        <li>第三者提供：法令に基づく場合を除き行いません</li>
        <li>安全管理措置：アクセス制御、暗号化等の適切な対策を実施</li>
        <li>開示・訂正・削除：合理的範囲で速やかに対応します</li>
      </ul>
      <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
        本ポリシーの内容は、必要に応じて改定される場合があります。
      </p>
    </main>
  );
}

 
