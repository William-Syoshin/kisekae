import Replicate from 'replicate'

export interface FluxGenerateImageRequest {
  prompt: string
}

export interface FluxGenerateImageResponse {
  success: boolean
  image_url?: string
  error?: string
}

/**
 * Flux Schnellで画像を生成
 * コスト: $0.003/画像（DALL-E 3の1/13）
 * レート制限対応の自動リトライ機能付き
 */
export async function generateImageWithFlux(
  prompt: string
): Promise<FluxGenerateImageResponse> {
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

      console.log(`Flux Schnell画像生成開始: ${prompt} (試行 ${attempt}/${maxRetries})`)

      // predictions.createとwaitを使用（より安定した方法）
      const prediction = await replicate.predictions.create({
        model: "black-forest-labs/flux-schnell",
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90,
          disable_safety_checker: false
        }
      })

      console.log('Prediction作成完了、完了を待機中...')

      // 完了を待つ
      const result = await replicate.wait(prediction)

      console.log('Flux Schnell画像生成成功!')
      console.log('結果ステータス:', result.status)
      console.log('結果出力:', result.output)

      // resultのoutputから画像URLを取得
      if (result.output && Array.isArray(result.output) && result.output.length > 0) {
        const imageUrl = result.output[0] as string
        console.log('生成画像URL:', imageUrl)

        return {
          success: true,
          image_url: imageUrl
        }
      } else {
        console.error('画像URLが見つかりませんでした:', JSON.stringify(result))
        throw new Error('画像URLが見つかりませんでした')
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
      console.error('Flux画像生成エラー:', lastError)
      
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
 * 英語プロンプトを生成（より良い結果のため）
 */
export function createEnglishPrompt(japanesePrompt: string): string {
  // 基本的なプロンプトテンプレート
  return `A detailed high-quality fashion photography of ${japanesePrompt}, professional studio lighting, fashion magazine style, elegant, 4k, high resolution, detailed texture`
}

