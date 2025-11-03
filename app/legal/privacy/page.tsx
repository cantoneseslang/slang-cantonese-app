export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>プライバシーポリシー</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>最終改定日: 2025年7月14日（雛形）</p>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <p>本ポリシーは、当サービスにおける個人情報の取り扱いについて定めたものです。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>1. 収集する情報</h2>
        <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          <li>アカウント作成・ログインに必要な情報（メールアドレス等）</li>
          <li>サービス提供・不正検知のための技術情報（IP、端末情報等）</li>
        </ul>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>2. 利用目的</h2>
        <p>サービス提供、サポート、品質向上、不正防止のために利用します。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>3. 保存と共有</h2>
        <p>必要な範囲でのみ保存し、第三者へは法令に基づく場合等を除き共有しません。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>4. セキュリティ</h2>
        <p>適切な技術的・組織的安全管理措置を講じます。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>5. ユーザーの権利</h2>
        <p>開示・訂正・削除等のご請求はお問い合わせよりご連絡ください。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>6. 改定</h2>
        <p>本ポリシーは改定される場合があります。重要な変更は告知します。</p>
      </section>
    </main>
  )
}


