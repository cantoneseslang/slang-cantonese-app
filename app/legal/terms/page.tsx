export default function TermsPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>利用規約</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>（雛形）</p>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <p>
          本規約は、本サービスの利用条件を定めるものです。お客様は本規約に同意のうえで本サービスをご利用ください。
        </p>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第1条 アカウントおよび利用資格</h2>
        <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          <li>外部IDプロバイダーによるアカウント作成に対応する場合があります。</li>
          <li>アカウント情報は正確かつ最新に保つ責任があります。</li>
          <li>規約違反等がある場合、登録拒否・解約を行うことがあります。</li>
        </ul>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第2条 サービスの内容</h2>
        <p>本サービスは広東語学習を支援する機能を提供します。無料/有料プランの区別や機能・制限は変更されることがあります。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第3条 サービス利用許諾</h2>
        <p>本規約に従った非独占的・取消可能な利用許諾を付与します。リバースエンジニアリング、再販等は禁止です。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第4条 料金および支払い</h2>
        <p>有料プランは前払いで請求され、自動更新される場合があります。解約は設定から可能です。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第5条 ユーザーコンテンツ</h2>
        <p>ユーザーが入力したコンテンツの権利はユーザーに帰属します。必要な処理の範囲でのみ利用します。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第6条 禁止事項</h2>
        <p>法令違反、公序良俗違反、悪質なスパム、不正アクセス等を禁止します。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第7条 プライバシー</h2>
        <p>個人情報の取扱いは別途プライバシーポリシーに従います。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第8条 解約・停止</h2>
        <p>ユーザーの違反時は解約・停止措置を行うことがあります。ユーザーは設定から解約可能です。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第9条 免責事項</h2>
        <p>本サービスは現状有姿で提供され、翻訳精度や継続運用等の保証は行いません。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第10条 責任の制限</h2>
        <p>当社の責任は、一定期間に支払われた料金を上限とします。結果的損害等は責任を負いません。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第11条 規約変更</h2>
        <p>本規約は改定される場合があります。重要な変更は事前に通知します。</p>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>第12条 準拠法</h2>
        <p>本規約は香港法に準拠します。</p>
      </section>
    </main>
  )
}


