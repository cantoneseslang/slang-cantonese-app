export default function ContactPage() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = String(fd.get('email') || '')
    const name = String(fd.get('name') || '')
    const message = String(fd.get('message') || '')
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null
    if (btn) btn.disabled = true
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, message })
      })
      const data = await res.json()
      if (data.success) {
        alert('送信しました。返信までお待ちください。')
        form.reset()
      } else {
        alert('送信に失敗しました: ' + (data.error || 'unknown'))
      }
    } catch (err: any) {
      alert('送信に失敗しました: ' + (err?.message || String(err)))
    } finally {
      if (btn) btn.disabled = false
    }
  }
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>お問い合わせ</h1>
      <p style={{ color: '#4b5563', marginBottom: '1.25rem' }}>
        ご質問やご要望、不具合のご連絡は以下のフォームまたはメールでお寄せください。
      </p>

      {/* 簡易フォーム（実装済みの送信先が無い場合はメール案内を表示） */}
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>お名前（任意）</span>
            <input name="name" type="text" placeholder="お名前" style={{ height: 44, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 12px' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>メールアドレス</span>
            <input name="email" required type="email" placeholder="you@example.com" style={{ height: 44, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 12px' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>お問い合わせ内容</span>
            <textarea name="message" required placeholder="ご用件を入力してください" rows={6} style={{ borderRadius: 8, border: '1px solid #e5e7eb', padding: 12 }} />
          </label>
          <button type="submit" style={{ height: 44, borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', fontWeight: 700 }}>
            送信
          </button>
        </div>
      </form>

      <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: 14 }}>
        送信ボタンは準備中です。お急ぎの方は <a href="mailto:info@lifesupporthk.com" style={{ textDecoration: 'underline' }}>info@lifesupporthk.com</a> へご連絡ください（平日10:00〜17:00）。
      </div>
    </main>
  )
}


