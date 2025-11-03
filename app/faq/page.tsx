export default function FaqPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>よくある質問</h1>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>広東語万能辞書って何？</h2>
          <ul style={{ paddingLeft: '1.25rem', color: '#374151', display: 'grid', gap: 6 }}>
            <li>ただ発音するだけでなく、学習に役立つ情報を提供します</li>
            <li>シーンに応じた複数表現の提案や検索も可能です</li>
            <li>入力テキストの発音（粤ピン/カタカナ）を再生して確認できます</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>どのような環境で利用できますか？</h2>
          <p style={{ color: '#374151' }}>Webブラウザでご利用いただけます。将来的にデスクトップ版も検討中です。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>データはサーバーに保存される？安全性について</h2>
          <p style={{ color: '#374151' }}>お気に入りなどのアカウントデータは安全に保存します。検索テキストは必要範囲のみ利用し、学習用途には使用しません。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>翻訳データはAIモデルの学習に使用されない？</h2>
          <p style={{ color: '#374151' }}>使用しません。再学習に用いないポリシーで運用します。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>無料で使える？</h2>
          <p style={{ color: '#374151' }}>無料でお試し可能です。より多く使う場合は有料プランをご検討ください。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>企業向けプランはある？</h2>
          <p style={{ color: '#374151' }}>検討中です。ご要望は <a href="/contact" style={{ textDecoration: 'underline' }}>お問い合わせ</a> からご連絡ください。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>セキュリティチェックシートに回答してほしい</h2>
          <p style={{ color: '#374151' }}>info@lifesupporthk.com までご連絡ください。</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>ファイルや画像の翻訳には対応してる？</h2>
          <p style={{ color: '#374151' }}>TXT/PDFの読み込みと、モバイルの画像OCRに対応しています。</p>
        </section>
      </div>
    </main>
  )
}


