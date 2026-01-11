// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// セッションIDで写真を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    const supabase = getSupabaseClient()

    if (sessionId) {
      // 特定のセッションの写真を取得
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('写真取得エラー:', error)
        return NextResponse.json(
          { error: '写真の取得に失敗しました。', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ photos: data })
    } else {
      // 全ての写真を取得（セッション情報付き）
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          sessions (
            id,
            nickname,
            clothing_prompt,
            created_at
          )
        `)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('写真取得エラー:', error)
        return NextResponse.json(
          { error: '写真の取得に失敗しました。', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ photos: data })
    }
  } catch (error) {
    console.error('写真取得エラー:', error)
    return NextResponse.json(
      { error: '写真の取得に失敗しました。', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// VTON結果を更新
export async function PUT(request: NextRequest) {
  try {
    const { session_id, vton_result_url } = await request.json()

    if (!session_id || !vton_result_url) {
      return NextResponse.json(
        { error: 'session_idとvton_result_urlが必要です' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // 最新のphotoレコードを取得
    const { data: latestPhoto, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('session_id', session_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !latestPhoto) {
      console.error('Photo取得エラー:', fetchError)
      return NextResponse.json(
        { error: '写真が見つかりません' },
        { status: 404 }
      )
    }

    // VTON結果URLを更新
    // @ts-ignore - Supabaseの型定義が最新のスキーマと一致していないため
    const { error: updateError } = await supabase
      .from('photos')
      .update({ vton_result_url })
      .eq('id', latestPhoto.id)

    if (updateError) {
      console.error('VTON結果更新エラー:', updateError)
      return NextResponse.json(
        { error: 'VTON結果の保存に失敗しました', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('VTON結果更新エラー:', error)
    return NextResponse.json(
      { error: 'VTON結果の保存に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
