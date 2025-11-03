export default function ContactPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>お問い合わせ</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.25rem' }}>
        ご質問やご要望、不具合のご連絡は以下のフォームまたはメールでお寄せください。
      </p>

      {/* 簡易フォーム（実装済みの送信先が無い場合はメール案内を表示） */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>メールアドレス</span>
            <input type="email" placeholder="you@example.com" style={{ height: 44, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 12px' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>お問い合わせ内容</span>
            <textarea placeholder="ご用件を入力してください" rows={6} style={{ borderRadius: 8, border: '1px solid #e5e7eb', padding: 12 }} />
          </label>
          <button disabled style={{ height: 44, borderRadius: 8, background: '#9ca3af', color: 'white', border: 'none', fontWeight: 700 }}>
            送信（準備中）
          </button>
        </div>
      </div>

      <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: 14 }}>
        送信ボタンは準備中です。お急ぎの方は <a href="mailto:hello@example.com" style={{ textDecoration: 'underline' }}>hello@example.com</a> へご連絡ください。
      </div>
    </main>
  )
}


