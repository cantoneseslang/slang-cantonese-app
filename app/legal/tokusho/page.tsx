export default function TokushoPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>特定商取引法に基づく表記</h1>
      

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '35%', padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>事業者名</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>LIFESUPPORT (HK) LIMITED</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>運営責任者</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>（氏名を記載）</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>所在地</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>G/F No.163 Pan Chung, Tai Po, NT, HONG KONG</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>お問い合わせ</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <div><a href="/contact" style={{ textDecoration: 'underline' }}>お問い合わせフォーム</a></div>
                <div>メール: <a href="mailto:info@lifesupporthk.com" style={{ textDecoration: 'underline' }}>info@lifesupporthk.com</a>（平日10:00〜17:00）</div>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>販売価格</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>各商品ページに表示（消費税込）</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>支払方法</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>クレジットカード決済（Stripe等）</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>役務の提供時期</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>決済完了後、即時または各商品ごとに表示</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>返品・キャンセル</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>デジタル商品特性上、原則不可（法定の定めがある場合を除く）</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  )
}


