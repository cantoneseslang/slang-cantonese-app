import categoriesData from '@/data/categories.json'

export default function AboutPage() {
  // 総ボタン数（ヘルプと同じ算出ロジック）
  const totalButtons = (() => {
    try {
      const data: any[] = categoriesData as any[]
      let total = 0
      for (const c of data) {
        if (!c || c.id === 'pronunciation') continue
        if (Array.isArray(c.words)) total += c.words.length
        if (Array.isArray(c.practiceGroups)) {
          for (const g of c.practiceGroups) {
            if (g && Array.isArray(g.words)) total += g.words.length
          }
        }
      }
      return total
    } catch {
      return 0
    }
  })()
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>カントン語音れんって何？</h1>

      <section style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>ようこそ！</h2>
        <p>広東語初心の方へ！ようこそスラング式カントン語音れんへ！</p>
        <p>スラング先生考案!カントン語音れん☝️(全{totalButtons}単語)収録！</p>

        <ul style={{ paddingLeft: '1.25rem', color: '#374151', display: 'grid', gap: 6 }}>
          <li>広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください</li>
          <li>日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください</li>
          <li>ジャンル分け(トータル45ジャンル収録)は右側で押して切り替えを行なってください</li>
        </ul>

        <p>粤ピンとは香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)</p>
        <p>近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。</p>
        <p>スラング式カタカナとは広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。</p>
        <p>スラング式カタカナ変換表必要な方はページ最下部のリンクよりダウンロードください(商用/転載は禁止としております)</p>
        <p>多音時の場合、複数声調およびカタカナに()が表示されます。</p>
        <p>変調は考慮されていない発音記号が表示されます。</p>
        <p>広東語特有の表現でgoogle翻訳が正確でない場合があります。</p>
        <p>この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。</p>
      </section>

      {/* 機能の要点リスト（ようこそのあとに配置） */}
      <section style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
        <ul style={{ paddingLeft: '1.25rem', color: '#374151', display: 'grid', gap: 6 }}>
          <li>ボタンを押すだけで発音を確認できます</li>
          <li>ただ発音するだけでなく、学習に役立つ情報を提供します</li>
          <li>シーンに応じた複数表現の提案や検索も可能です</li>
          <li>入力テキストの発音（粤ピン/カタカナ）を再生して確認できます</li>
          <li>noteと連携し、教材となるボタンがどんどん追加されていきます</li>
        </ul>
      </section>
    </main>
  )
}


