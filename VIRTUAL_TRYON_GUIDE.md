# 🎨 Virtual Try-on（バーチャル試着）実装ガイド

## 🎯 目標

撮影した人物写真に、AI生成した服を着せる機能を実装します。

**要件:**
- ✅ 生成した服を人物に着せる
- ✅ 顔や体型は変えない
- ✅ 服だけを置き換える

---

## 🔧 実装方法の選択肢

### オプション1: Replicate API（推奨）✅

**モデル:** IDM-VTON または OOTDiffusion

**メリット:**
- ✅ 高品質なVirtual Try-on専用モデル
- ✅ APIで簡単に使える
- ✅ 服だけを置き換える
- ✅ 顔や体型を保持

**デメリット:**
- コストがかかる（$0.01-0.05/画像）

**推奨度:** ⭐⭐⭐⭐⭐

---

### オプション2: Hugging Face Inference API

**モデル:** Virtual Try-on専用モデル

**メリット:**
- ✅ 無料枠がある
- ✅ 複数のモデルから選択可能

**デメリット:**
- 品質がやや劣る場合がある
- レスポンスが遅い

**推奨度:** ⭐⭐⭐⭐

---

### オプション3: Difyで実装

**方法:** カスタムツールまたはHTTP Request

**メリット:**
- ✅ 既存のワークフローに統合しやすい

**デメリット:**
- 外部APIを呼び出す必要がある

**推奨度:** ⭐⭐⭐⭐

---

## 🚀 推奨実装：Replicate API + IDM-VTON

### ステップ1: Replicate APIキーを取得

#### 1. Replicateにアクセス

```
https://replicate.com/
```

#### 2. アカウント作成・ログイン

#### 3. APIキーを取得

```
Account → API Tokens → Create token
```

#### 4. APIキーをコピー

```
r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### ステップ2: 環境変数に追加

`.env.local`に追加：

```bash
# Replicate API（Virtual Try-on用）
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### ステップ3: Virtual Try-on用の関数を実装

#### 1. Replicate SDKをインストール

```bash
npm install replicate
```

#### 2. Virtual Try-on関数を作成

`lib/virtual-tryon.ts`を作成：

```typescript
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
 * Virtual Try-on: 人物に服を着せる
 */
export async function applyVirtualTryon(
  request: VirtualTryonRequest
): Promise<VirtualTryonResponse> {
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

    console.log('Virtual Try-on開始...')

    // IDM-VTONモデルを使用
    const output = await replicate.run(
      "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
      {
        input: {
          human_img: request.personImage,
          garm_img: request.garmentImage,
          garment_des: "clothing item", // 服の説明（オプション）
        }
      }
    )

    console.log('Virtual Try-on成功:', output)

    // outputは画像URLの配列
    const resultImage = Array.isArray(output) ? output[0] : output

    return {
      success: true,
      resultImage: resultImage as string
    }
  } catch (error) {
    console.error('Virtual Try-onエラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

---

### ステップ4: APIエンドポイントを作成

`app/api/virtual-tryon/route.ts`を作成：

```typescript
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

    const result = await applyVirtualTryon({
      personImage,
      garmentImage
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultImage: result.resultImage
    })
  } catch (error) {
    console.error('Virtual Try-on APIエラー:', error)
    return NextResponse.json(
      { error: 'Virtual Try-onに失敗しました' },
      { status: 500 }
    )
  }
}
```

---

### ステップ5: UIに機能を追加

`components/CameraCapture.tsx`に追加：

```typescript
// Virtual Try-on関連のstate
const [tryonResult, setTryonResult] = useState<string | null>(null)
const [isTryingOn, setIsTryingOn] = useState(false)

// Virtual Try-onを実行
const applyTryon = async () => {
  if (!capturedImage || !generatedImageUrl) {
    showMessage('写真と生成画像の両方が必要です', 'error')
    return
  }

  setIsTryingOn(true)
  showMessage('Virtual Try-onを実行中...', 'info')

  try {
    const response = await fetch('/api/virtual-tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personImage: capturedImage,
        garmentImage: generatedImageUrl
      })
    })

    const result = await response.json()

    if (result.success) {
      setTryonResult(result.resultImage)
      showMessage('Virtual Try-on完了！', 'success')
    } else {
      showMessage(`エラー: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('Virtual Try-onエラー:', error)
    showMessage('Virtual Try-onに失敗しました', 'error')
  } finally {
    setIsTryingOn(false)
  }
}
```

UIに追加：

```tsx
{/* Virtual Try-onボタン */}
{capturedImage && generatedImageUrl && (
  <div className="mt-6">
    <button
      onClick={applyTryon}
      disabled={isTryingOn}
      className="w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isTryingOn ? (
        <>
          <span className="inline-block animate-spin mr-2">🔄</span>
          試着中...
        </>
      ) : (
        <>
          <span className="mr-2">👔</span>
          この服を試着する
        </>
      )}
    </button>
  </div>
)}

{/* Virtual Try-on結果 */}
{tryonResult && (
  <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
    <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">
      🎉 試着結果
    </h3>
    <div className="rounded-xl overflow-hidden shadow-lg">
      <img
        src={tryonResult}
        alt="試着結果"
        className="w-full h-auto"
      />
    </div>
  </div>
)}
```

---

## 📊 実装フロー

```
1. ユーザーがプロンプト入力
   ↓
2. AI画像生成（服の画像）
   ↓
3. カメラで撮影（人物写真）
   ↓
4. 「この服を試着する」ボタンをクリック
   ↓
5. Virtual Try-on API呼び出し
   - 人物写真
   - 服の画像
   ↓
6. 30-60秒後、試着結果表示
   ↓
7. 結果をSupabaseに保存（オプション）
```

---

## 💰 コスト

### Replicate IDM-VTON

- **価格:** 約$0.01-0.05/画像
- **処理時間:** 30-60秒

### 月間コスト見積もり

| 使用回数 | 月間コスト |
|---------|----------|
| 100回 | $1-5 |
| 500回 | $5-25 |
| 1000回 | $10-50 |

---

## 🎯 他のVirtual Try-onモデル

### OOTDiffusion

```typescript
const output = await replicate.run(
  "levihsu/ootdiffusion:4a610047f3e7f6cf1ff1749c8f7795e0f5cd0c04c2a86c92f5a8593be77cc29f",
  {
    input: {
      model_image: request.personImage,
      cloth_image: request.garmentImage,
    }
  }
)
```

### Kolors Virtual Try-on

```typescript
const output = await replicate.run(
  "kwai-kolors/kolors-virtual-try-on:...",
  {
    input: {
      human_image: request.personImage,
      cloth_image: request.garmentImage,
    }
  }
)
```

---

## 🐛 トラブルシューティング

### エラー: 「Replicate API Tokenが設定されていません」

**解決:** `.env.local`に`REPLICATE_API_TOKEN`を追加

### エラー: 「Processing timeout」

**原因:** 処理に時間がかかりすぎている

**解決:** Replicateの有料プランにアップグレード

### 品質が悪い

**解決:**
- 高解像度の画像を使用
- 正面を向いた人物写真を使用
- 服がはっきり見える画像を使用

---

## 📝 次のステップ

1. Replicate APIキーを取得
2. `npm install replicate`
3. `lib/virtual-tryon.ts`を作成
4. APIエンドポイントを作成
5. UIにボタンを追加
6. テスト

---

**Virtual Try-onは高度な機能ですが、これで実装できます！** 🎉

進めますか？🚀


