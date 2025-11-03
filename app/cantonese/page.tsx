export default function CantoneseIntroPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>カントン語（広東語）ってなに？</h1>

      <section style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>1. 中国語の標準語は「普通话 (pǔtōnghuà)」</h2>
        <p>
          中国の公用語・標準語は「普通话（プートンファ）」です。北京の官話に由来し、英語圏では「マンダリン」と呼ばれます。中国は多民族・多言語で、広東語・上海語など多くの言語（方言）が共存し、普通话は各民族の共通語として整備されました。
        </p>
        <p>
          広東語は香港・マカオ・広東省、世界各地のチャイナタウンで広く使われる国際的な言語です。北京語や上海語とは系統が異なり、独立した「言語」と見なす立場もあります。
        </p>
      </section>

      <section style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>1-2. 中国には多くの言語（方言）がある</h2>
        <p>
          中国は漢民族と55の少数民族からなる多民族国家で、言語も多様です。主要な方言群には「北方語・湘語・贛語・呉語・閩語・粤語・客家語」があり、広東語は「粤語」に属します。香港・マカオ、広東省のほか、マレーシアやシンガポールなど世界のチャイナタウンでも話されています。
        </p>
        <p>
          歴史的に、19世紀以降の移民の影響で海外華人社会では広東語が広く使われ、現在も大きな話者人口（8,000万人〜1億人）を持ちます。
        </p>
      </section>

      <section style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>2. 最大の違いは「文字」</h2>
        <p>
          標準語の簡体字は1950年代に中国で制定。香港・マカオでは植民地時代から繁体字を使い続け、返還後も繁体字文化が継承されています。日本人にとっては繁体字の方が意味推測しやすく、香港や台湾では筆談もある程度可能です。
        </p>
      </section>

      <section style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>2-1. 漢字の違い</h2>
        <p>
          広東語で使う漢字は繁体字、標準中国語（普通話）で使われる漢字は簡体字が中心です。繁体字は元の字形に近く画数が多いのが特徴、簡体字は1950年代以降に画数を減らした字形です。 すべてが違うわけではなく、部分的に異なります。
        </p>
        <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
          <li>(日本語)学習 →(広東語)學習 →(中国語)学习</li>
          <li>(日本語)中国 →(広東語)中國 →(中国語)中国</li>
          <li>(日本語)身体 →(広東語)身體 →(中国語)身体</li>
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <p>
          ここまで読んでいただいた方は、きっと広東語に興味をお持ちの方！さっそく広東語の一番重要な発音を本アプリ「カントン語音れん」で発音から楽しく学んでいきましょう。
          <br />
          <a href="/" style={{ fontWeight: 800 }}>トップページに戻る</a>
        </p>
      </section>
    </main>
  )
}


