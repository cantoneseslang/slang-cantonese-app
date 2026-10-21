import { redirect } from 'next/navigation';

type ListenQuery = { q?: string; ja?: string };

export default async function ListenPage({ searchParams }: { searchParams: Promise<ListenQuery> }) {
  const params = await searchParams;
  const q = String(params.q || '').normalize('NFKC').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80);
  if (!q) redirect('/login');
  const next = new URLSearchParams({ entry: 'line', q });
  const ja = String(params.ja || '').normalize('NFKC').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 120);
  if (ja) next.set('ja', ja);
  redirect('/?' + next.toString());
}
