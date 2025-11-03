export default function AboutPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>カントン語音れんって何？</h1>

      <section style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <ul style={{ paddingLeft: '1.25rem', color: '#374151', display: 'grid', gap: 6 }}>
          <li>ボタンを押すだけで発音を確認できます</li>
          <li>ただ発音するだけでなく、学習に役立つ情報を提供します</li>
          <li>シーンに応じた複数表現の提案や検索も可能です</li>
          <li>入力テキストの発音（粤ピン/カタカナ）を再生して確認できます</li>
          <li>noteと連携し、教材となるボタンがどんどん追加されていきます</li>
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>ようこそ！</h2>
        <p>広東語初心の方へ！ようこそスラング式カントン語音れんへ！</p>
        <p>スラング先生考案!カントン語音れん☝️（全ボタン数はトップヘルプに準拠）</p>
      </section>
    </main>
  )
}


