export default function FaqPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>FAQ</h1>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Q. ログインは必要ですか？</h2>
          <p style={{ color: '#374151' }}>学習機能の一部をご利用いただくにはログインが必要です。</p>
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Q. 不具合の連絡先は？</h2>
          <p style={{ color: '#374151' }}><a href="/contact" style={{ textDecoration: 'underline' }}>お問い合わせ</a> からご連絡ください。</p>
        </div>
      </div>
    </main>
  )
}


