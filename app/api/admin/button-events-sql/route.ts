import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 })

  const adminEmails = ['bestinksalesman@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin === true
  if (!isAdmin) return NextResponse.json({ success: false, error: '管理者権限が必要です' }, { status: 403 })

  const sql = `
CREATE TABLE IF NOT EXISTS public.user_button_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  button_key TEXT NOT NULL,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ube_user_id ON public.user_button_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ube_button_key ON public.user_button_events(button_key);
ALTER TABLE public.user_button_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own button events"
  ON public.user_button_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own button events"
  ON public.user_button_events FOR INSERT WITH CHECK (auth.uid() = user_id);
`.trim()

  return NextResponse.json({ success: true, sql })
}



