import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { gender, residence, residenceOther, cantoneseLevel } = await request.json()
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // user_metadataにアンケート結果を保存
    const updatedMetadata = {
      ...user.user_metadata,
      survey_gender: gender,
      survey_residence: residence,
      survey_residence_other: residenceOther || null,
      survey_cantonese_level: cantoneseLevel,
      survey_completed: true,
      survey_completed_at: new Date().toISOString(),
    }

    const { error } = await supabase.auth.updateUser({
      data: updatedMetadata
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'エラーが発生しました' }, { status: 500 })
  }
}

