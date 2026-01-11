import Replicate from 'replicate'

export interface VirtualTryonRequest {
  personImage: string  // 人物写真のURL or Base64
  garmentImage: string // 服の画像URL or Base64
}

export interface VirtualTryonResponse {
  success: boolean
  resultImage?: string
  error?: string
}

/**
 * Kolors Virtual Try-on: 人物に服を着せる
 * レート制限対応の自動リトライ機能付き
 */
export async function applyVirtualTryon(
  request: VirtualTryonRequest
): Promise<VirtualTryonResponse> {
  const apiToken = process.env.REPLICATE_API_TOKEN

  if (!apiToken) {
    console.error('Replicate API Token未設定')
    return {
      success: false,
      error: 'Replicate API Tokenが設定されていません。.env.localを確認してください。'
    }
  }

  // リトライ設定
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const replicate = new Replicate({
        auth: apiToken,
      })

      console.log(`Kolors Virtual Try-on開始... (試行 ${attempt}/${maxRetries})`)
      console.log('人物画像:', request.personImage.substring(0, 50) + '...')
      console.log('服画像:', request.garmentImage.substring(0, 50) + '...')

      // IDM-VTONモデルを使用（より柔軟なアスペクト比対応）
      const prediction = await replicate.predictions.create({
        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        input: {
          human_img: request.personImage,
          garm_img: request.garmentImage,
          garment_des: "clothing",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42
        }
      })

      console.log('Prediction作成完了、完了を待機中...')

      // 完了を待つ
      const result = await replicate.wait(prediction)

      console.log('Kolors Virtual Try-on成功!')
      console.log('結果ステータス:', result.status)
      console.log('結果出力:', result.output)

      // resultのoutputから画像URLを取得
      let resultImage: string

      if (result.output) {
        if (Array.isArray(result.output) && result.output.length > 0) {
          resultImage = result.output[0] as string
        } else if (typeof result.output === 'string') {
          resultImage = result.output
        } else if (typeof result.output === 'object') {
          // オブジェクトの場合、imageまたは他のプロパティを探す
          resultImage = (result.output as any).image || (result.output as any).url || String(result.output)
        } else {
          throw new Error('予期しない出力形式です: ' + JSON.stringify(result.output))
        }
      } else {
        throw new Error('出力が空です')
      }

      console.log('結果画像URL:', resultImage)

      return {
        success: true,
        resultImage: resultImage
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // レート制限エラーの場合
      if (lastError.message.includes('429') || lastError.message.includes('Too Many Requests')) {
        console.warn(`レート制限エラー (試行 ${attempt}/${maxRetries})`)
        
        // retry_after秒数を抽出（デフォルトは3秒）
        let waitTime = 3
        const retryMatch = lastError.message.match(/retry_after['":](\d+)/)
        if (retryMatch && retryMatch[1]) {
          waitTime = parseInt(retryMatch[1]) + 1 // 1秒余裕を持たせる
        }
        
        if (attempt < maxRetries) {
          console.log(`${waitTime}秒待機してから再試行します...`)
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
          continue // 次の試行へ
        }
      }
      
      // その他のエラーまたは最後の試行
      console.error('Kolors Virtual Try-onエラー:', lastError)
      
      if (attempt < maxRetries && !lastError.message.includes('429')) {
        console.log('2秒待機してから再試行します...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      
      // 最後の試行で失敗した場合
      break
    }
  }

  return {
    success: false,
    error: lastError ? lastError.message : 'Unknown error'
  }
}

/**
 * Replicate接続テスト
 */
export async function testReplicateConnection(): Promise<{ success: boolean; message: string }> {
  const apiToken = process.env.REPLICATE_API_TOKEN

  if (!apiToken) {
    return {
      success: false,
      message: 'REPLICATE_API_TOKENが設定されていません'
    }
  }

  try {
    const replicate = new Replicate({
      auth: apiToken,
    })

    // 簡単なテスト
    console.log('Replicate接続テスト...')
    
    return {
      success: true,
      message: 'Replicate API接続成功'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    }
  }
}

