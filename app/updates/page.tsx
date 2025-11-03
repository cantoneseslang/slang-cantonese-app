export default function UpdatesPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>更新情報</h1>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>2025/11/01</div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>大型アップデート: Vercel に移行</div>
          <div style={{ color: '#374151' }}>GAS 版から Next.js + Vercel へ移行し、パフォーマンスと拡張性を改善しました。</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>以前</div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>GAS での「広東語万能辞書」として提供</div>
          <div style={{ color: '#374151' }}>GAS（Google Apps Script）で提供していた旧版からの継承です。</div>
        </div>
      </div>
    </main>
  )
}


