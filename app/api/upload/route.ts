// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { image, session_id } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: '画像データがありません。' },
        { status: 400 }
      )
    }

    if (!session_id) {
      return NextResponse.json(
        { error: 'セッションIDが指定されていません。' },
        { status: 400 }
      )
    }

    // Base64データから画像を抽出
    const base64Data = image.replace(/^data:image\/png;base64,/, '')
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.png`
    
    const supabase = getSupabaseClient()

    // Supabase Storageにアップロード
    const fileBuffer = Buffer.from(base64Data, 'base64')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('photos')
      .upload(filename, fileBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (storageError) {
      console.error('Supabase Storage アップロードエラー:', storageError)
      return NextResponse.json(
        { error: 'ストレージへのアップロードに失敗しました。', details: storageError.message },
        { status: 500 }
      )
    }

    // Supabase Storageの公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filename)

    const publicUrl = publicUrlData.publicUrl

    // Supabaseデータベースに保存（session_idと紐付け）
    const { data: dbData, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          session_id: session_id,
          filename: filename,
          filepath: publicUrl, // 公開URLを使用
          storage_url: publicUrl,
          timestamp: new Date().toISOString()
        }
      ])
      .select()

    if (dbError) {
      console.error('Supabaseデータベース保存エラー:', dbError)
      return NextResponse.json(
        { error: 'データベースへの保存に失敗しました。', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '写真が保存されました！',
      photo: {
        id: dbData[0].id,
        session_id: dbData[0].session_id,
        filename: filename,
        filepath: `/uploads/${filename}`,
        storage_url: publicUrl
      }
    })
  } catch (error) {
    console.error('アップロードエラー:', error)
    return NextResponse.json(
      { error: 'ファイルの保存に失敗しました。', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
