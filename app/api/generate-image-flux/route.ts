import { NextRequest, NextResponse } from 'next/server'
import { generateImageWithFlux } from '@/lib/image-generation'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { clothing_prompt, session_id } = await request.json()

    if (!clothing_prompt) {
      return NextResponse.json(
        { error: 'clothing_promptが必要です' },
        { status: 400 }
      )
    }

    console.log('Flux画像生成リクエスト:', { clothing_prompt, session_id })

    // プロンプトをそのまま使用（フロントエンドで既に英語に変換済み）
    console.log('使用プロンプト:', clothing_prompt)

    const result = await generateImageWithFlux(clothing_prompt)

    if (!result.success) {
      console.error('Flux画像生成失敗:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('Flux画像生成成功:', result.image_url)

    // セッションに画像URLを保存
    if (session_id && result.image_url) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error: updateError } = await supabase
          .from('sessions')
          .update({ generated_image_url: result.image_url })
          .eq('id', session_id)

        if (updateError) {
          console.error('セッション更新エラー:', updateError)
        } else {
          console.log('セッションに画像URLを保存しました')
        }
      } catch (dbError) {
        console.error('データベースエラー:', dbError)
        // エラーがあってもレスポンスは返す
      }
    }

    return NextResponse.json({
      success: true,
      image_url: result.image_url,
      message: 'Flux Schnellで画像を生成しました！'
    })
  } catch (error) {
    console.error('Flux画像生成APIエラー:', error)
    return NextResponse.json(
      { 
        error: '画像生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 接続テスト用
export async function GET() {
  const apiToken = process.env.REPLICATE_API_TOKEN

  return NextResponse.json({
    configured: !!apiToken,
    message: apiToken 
      ? 'Replicate API設定済み（Flux Schnell使用可能）' 
      : 'Replicate API未設定 - .env.localを確認してください'
  })
}


