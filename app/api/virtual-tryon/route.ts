import { NextRequest, NextResponse } from 'next/server'
import { applyVirtualTryon } from '@/lib/virtual-tryon'

export async function POST(request: NextRequest) {
  try {
    const { personImage, garmentImage } = await request.json()

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { error: '人物画像と服の画像が必要です' },
        { status: 400 }
      )
    }

    console.log('Virtual Try-onリクエスト開始')
    console.log('人物画像サイズ:', personImage.length)
    console.log('服画像サイズ:', garmentImage.length)

    const result = await applyVirtualTryon({
      personImage,
      garmentImage
    })

    if (!result.success) {
      console.error('Virtual Try-on失敗:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('Virtual Try-on成功!')

    return NextResponse.json({
      success: true,
      resultImage: result.resultImage,
      message: 'Virtual Try-on完了！'
    })
  } catch (error) {
    console.error('Virtual Try-on APIエラー:', error)
    return NextResponse.json(
      { 
        error: 'Virtual Try-onに失敗しました',
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
      ? 'Replicate API設定済み' 
      : 'Replicate API未設定 - .env.localを確認してください'
  })
}


