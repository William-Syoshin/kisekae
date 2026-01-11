// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// セッションを作成
export async function POST(request: NextRequest) {
  try {
    const { nickname, clothing_prompt } = await request.json()

    if (!nickname || !clothing_prompt) {
      return NextResponse.json(
        { error: 'ニックネームと服装プロンプトを入力してください。' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // セッションをデータベースに作成
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          nickname: nickname.trim(),
          clothing_prompt: clothing_prompt.trim()
        }
      ])
      .select()

    if (error) {
      console.error('セッション作成エラー:', error)
      return NextResponse.json(
        { error: 'セッションの作成に失敗しました。', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'セッションが作成されました！',
      session: data[0]
    })
  } catch (error) {
    console.error('セッション作成エラー:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました。', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// セッション一覧を取得
export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('セッション取得エラー:', error)
      return NextResponse.json(
        { error: 'セッションの取得に失敗しました。', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: data })
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return NextResponse.json(
      { error: 'セッションの取得に失敗しました。', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


