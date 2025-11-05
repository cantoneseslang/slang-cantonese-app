export default function AboutPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
        広東語初心の方へ！ようこそスラング式カントン語音れんへ！
      </h1>
      
      <div style={{ marginTop: '2rem' }}>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', marginBottom: '2rem', lineHeight: 1.8 }}>
          <li>ボタンを押すだけで発音を確認できます(ノーマルモード）</li>
          <li>ボタンを押すだけで発音と例文まで出てきます(学習モード）</li>
          <li>学習モードでは音声練習用に音声再生スピードの変更可能です</li>
          <li>お気に入りボタンに必要な単語だけを収録（ボタンを長押しするとお気に入りに自動収録）</li>
          <li>ボタンにないカントン語は入力欄に単語やフレーズを入力すれば翻訳機にもなります</li>
          <li>広東語の発音、意味を調べたい時、広東語を入力して🟦ボタン</li>
          <li>日本語を広東語に翻訳したい時、日本語を入力して🟩ボタン</li>
          <li>ファイルアイコンを押し写真やテキストファイルもOCRで読み込み翻訳できます</li>
          <li>noteにて教科書テキストを発行、それと連携しボタンがどんどんと追加されてます</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
          スラング先生考案!カントン語音れん☝️(全1007単語)収録！
        </p>
        <p style={{ marginBottom: '1rem' }}>
          広東語の漢字の意味・発音を調べたい時は入力欄に広東語を入れて「広東語発音」を押してください
        </p>
        <p style={{ marginBottom: '1rem' }}>
          日本語から広東語の文章・意味・発音を調べたい時は入力欄に日本語を入れて「日訳+広東語発音」を押してください
        </p>
        <p style={{ marginBottom: '1rem' }}>
          ジャンル分け(トータル45ジャンル収録)は右側で押して切り替えを行なってください
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          粤ピンとは
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          香港語言学学会粤語拼音方案、略称粤拼 (えつぴん、Jyutping)
        </p>
        <p style={{ marginBottom: '1rem' }}>
          近年香港で最も使用されている香港語言学学会（LSHK）によって制定された数字とアルファベットを用いた声調表記法です。
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          スラング式カタカナとは
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          広東語未学習者、初心者の日本語話者に容易に発音できる様に制作した独自変換ルールに則った表記法です。
        </p>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          スラング式カタカナ変換表必要な方はページ最下部のリンクよりダウンロードください(商用/転載は禁止としております)
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          注意事項
        </h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', lineHeight: 1.8 }}>
          <li>多音時の場合、複数声調およびカタカナに()が表示されます。</li>
          <li>変調は考慮されていない発音記号が表示されます。</li>
          <li>広東語特有の表現でgoogle翻訳が正確でない場合があります。</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.875rem', color: '#374151' }}>
          この文書に記載されている繁体字は、国際標準の『ISO/IEC 10646-1:2000』および『香港補助文字セット – 2001』（Hong Kong Supplementary Character Set – 2001）に含まれる全ての漢字、合計29,145個を含んでいます。
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '1rem' }}>
          それでは早速<a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>「カントン語音れん」</a>を始めてみましょう！
        </p>
      </div>
    </div>
  );
}

