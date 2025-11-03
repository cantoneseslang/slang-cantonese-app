"use client";

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    // ビルドは通す。実行時にわかるよう警告だけ出す
    if (typeof window !== 'undefined') {
      console.warn('Supabase env is missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }

  return createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');
}

 
