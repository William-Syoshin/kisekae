# 🎨 Replicate統一実装ガイド（コスト半減）

## 🎯 目標

画像生成とVirtual Try-onを両方Replicateで実装し、コストを約60%削減

---

## 📊 コスト削減の内訳

### Before（現在）

- 画像生成：DALL-E 3（$0.040）
- Virtual Try-on：Kolors（$0.023）
- **合計：$0.063/回**

### After（Replicate統一）

- 画像生成：Flux Schnell（$0.003）
- Virtual Try-on：Kolors（$0.023）
- **合計：$0.026/回**

**削減率：約60%削減** ✅

---

## 🔧 実装方法

### 方法A: コード実装（推奨）✅

Next.jsアプリで直接Replicate APIを呼び出す

**メリット:**
- ✅ 柔軟性が高い
- ✅ デバッグが簡単
- ✅ エラーハンドリングが容易
- ✅ タイムアウト制御可能

**実装:**
- 既存のVirtual Try-on実装を参考
- 画像生成もReplicateに変更

### 方法B: Dify HTTP Request

DifyワークフローでReplicate APIを呼び出す

**メリット:**
- ✅ ビジュアルで管理
- ✅ Difyで一元管理

**デメリット:**
- ポーリング処理が複雑

---

## 🎨 Fluxによる画像生成

### Fluxモデルの種類

| モデル | 速度 | 品質 | コスト | 推奨度 |
|--------|------|------|--------|--------|
| **Flux Schnell** | 超高速 | ⭐⭐⭐⭐ | $0.003 | ⭐⭐⭐⭐⭐ |
| **Flux Dev** | 速い | ⭐⭐⭐⭐⭐ | $0.025 | ⭐⭐⭐⭐ |
| **Flux Pro** | 普通 | ⭐⭐⭐⭐⭐ | $0.055 | ⭐⭐⭐ |

**推奨：Flux Schnell**（コストと品質のバランスが最高）

---

## 💻 コード実装

### ステップ1: 画像生成関数を更新

`lib/image-generation.ts`を新規作成または`lib/dify.ts`を更新：

```typescript
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
 */
export async function generateImageWithFlux(
  prompt: string
): Promise<FluxGenerateImageResponse> {
  const apiToken = process.env.REPLICATE_API_TOKEN

  if (!apiToken) {
    return {
      success: false,
      error: 'Replicate API Tokenが設定されていません'
    }
  }

  try {
    const replicate = new Replicate({
      auth: apiToken,
    })

    console.log('Flux画像生成開始:', prompt)

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90
        }
      }
    )

    console.log('Flux画像生成成功!')

    // outputは画像URLの配列
    const imageUrl = Array.isArray(output) ? output[0] : output

    return {
      success: true,
      image_url: imageUrl as string
    }
  } catch (error) {
    console.error('Flux画像生成エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

### ステップ2: APIエンドポイントを更新

`app/api/generate-image-flux/route.ts`を新規作成：

```typescript
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

    // 英語に翻訳（オプション - より良い結果のため）
    const englishPrompt = `A detailed fashion photography of ${clothing_prompt}, professional studio lighting, high quality, 4k`

    const result = await generateImageWithFlux(englishPrompt)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // セッションに画像URLを保存（オプション）
    if (session_id && result.image_url) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      await supabase
        .from('sessions')
        .update({ generated_image_url: result.image_url })
        .eq('id', session_id)
    }

    return NextResponse.json({
      success: true,
      image_url: result.image_url
    })
  } catch (error) {
    console.error('画像生成APIエラー:', error)
    return NextResponse.json(
      { error: '画像生成に失敗しました' },
      { status: 500 }
    )
  }
}
```

### ステップ3: フロントエンドを更新

`components/CameraCapture.tsx`の`generateImage`関数を更新：

```typescript
const generateImage = async () => {
  if (!currentSession) return

  setIsGenerating(true)
  showMessage('AI画像を生成中...', 'info')

  try {
    // Fluxで画像生成（Difyの代わり）
    const response = await fetch('/api/generate-image-flux', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clothing_prompt: currentSession.clothing_prompt,
        session_id: currentSession.id
      })
    })

    const result = await response.json()

    if (result.success) {
      setGeneratedImageUrl(result.image_url)
      showMessage('画像が生成されました！', 'success')
    } else {
      showMessage(`エラー: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('画像生成エラー:', error)
    showMessage('画像の生成に失敗しました。', 'error')
  } finally {
    setIsGenerating(false)
  }
}
```

---

## 🎯 セッション作成時の自動生成

`createSession`関数も更新：

```typescript
const createSession = async () => {
  // ... 既存のコード ...

  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      // ...
    })

    const data = await response.json()

    if (data.success) {
      setCurrentSession(data.session)
      setAppState('camera')
      startCamera()
      showMessage('セッションが作成されました！', 'success')
      
      // 画像生成を自動開始（Fluxで）
      autoGenerateImage(data.session)
    }
  } catch (error) {
    // ...
  }
}

const autoGenerateImage = async (session: Session) => {
  setIsGenerating(true)

  try {
    const response = await fetch('/api/generate-image-flux', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clothing_prompt: session.clothing_prompt,
        session_id: session.id
      })
    })

    const result = await response.json()

    if (result.success) {
      setGeneratedImageUrl(result.image_url)
      showMessage('画像が生成されました！参考にして撮影してください', 'success')
    } else {
      console.error('画像生成エラー:', result.error)
      showMessage('画像生成に失敗しました。手動で再試行できます。', 'error')
    }
  } catch (error) {
    console.error('自動画像生成エラー:', error)
    showMessage('画像生成に失敗しました', 'error')
  } finally {
    setIsGenerating(false)
  }
}
```

---

## 📋 実装手順まとめ

### 1. Replicate APIトークンを確認

`.env.local`に既に設定済み：

```bash
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. ファイルを作成

- [ ] `lib/image-generation.ts`（新規）
- [ ] `app/api/generate-image-flux/route.ts`（新規）

### 3. CameraCapture.tsxを更新

- [ ] `generateImage`関数を更新
- [ ] `autoGenerateImage`関数を更新

### 4. Difyワークフローを無効化（オプション）

画像生成をReplicateに切り替えたので、Difyの画像生成ワークフローは不要になります。

画像分析だけDifyを使い続けます。

### 5. サーバー再起動

```bash
npm run dev
```

---

## ✅ 最終的な構成

### AIサービスの使い分け

| 機能 | サービス | モデル | コスト |
|-----|---------|--------|--------|
| 画像生成 | Replicate | Flux Schnell | $0.003 |
| Virtual Try-on | Replicate | Kolors | $0.023 |
| 画像分析 | Dify/OpenAI | GPT-4o-mini | $0.001 |
| **合計** | | | **$0.027/回** |

**削減率：約57%削減** ✅

### 環境変数

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Replicate（画像生成 + Virtual Try-on）
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx

# Dify（画像分析のみ）
DIFY_ANALYZE_API_KEY=...
DIFY_ANALYZE_API_ENDPOINT=...
```

シンプルになりました！

---

## 🎉 メリット

### コスト削減

- ✅ 約60%削減（$0.063 → $0.026）
- ✅ 月間500回使用：$31.50 → $13

### シンプル化

- ✅ Replicate 1つで画像生成とVirtual Try-on
- ✅ 環境変数が減る
- ✅ APIキーの管理が楽

### 品質

- ✅ Flux Schnell：高速で高品質
- ✅ Kolors：Virtual Try-onに特化
- ✅ 両方最新のモデル

---

## 🐛 トラブルシューティング

### Fluxが動かない

**確認:**
- `REPLICATE_API_TOKEN`が設定されているか
- Replicateアカウントにクレジットがあるか

### 画像の品質が低い

**解決:**
- Flux Devに変更（$0.025、品質向上）
- プロンプトを詳細に

---

**この実装で、コストを半減しながら、管理もシンプルになります！** 🚀

実装しますか？


