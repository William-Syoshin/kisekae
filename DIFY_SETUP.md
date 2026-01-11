# Dify統合ガイド 🎨

このガイドでは、Difyを使った服装画像生成機能のセットアップ方法を説明します。

## 📋 目次

1. [Difyワークフローの作成](#1-difyワークフローの作成)
2. [環境変数の設定](#2-環境変数の設定)
3. [データベースの更新](#3-データベースの更新)
4. [動作確認](#4-動作確認)
5. [トラブルシューティング](#5-トラブルシューティング)

---

## 1. Difyワークフローの作成

### ステップ1: Difyにログイン

1. [Dify](https://dify.ai/) にアクセス
2. アカウントにログイン（またはサインアップ）

### ステップ2: 新しいワークフローを作成

1. ダッシュボードで「**Create Workflow**」をクリック
2. ワークフロー名: `clothing-image-generator`
3. 説明: `服装プロンプトから画像を生成`

### ステップ3: ノードを追加

#### 入力ノード (Input Node)

```
変数名: clothing_prompt
タイプ: text
必須: はい
説明: 服装の説明（例: 赤いワンピース）
```

#### LLMノード（プロンプト最適化 - オプション）

もしプロンプトを最適化したい場合:

**システムプロンプト:**
```
You are a fashion image generation expert. 
Convert the user's clothing description into a detailed, 
high-quality image generation prompt in English. 
Focus on style, colors, textures, lighting, and aesthetics.
Output only the optimized prompt without any explanation.
```

**ユーザープロンプト:**
```
{{clothing_prompt}}
```

**モデル:** GPT-4 / Claude / その他

#### 画像生成ノード (Image Generation Node)

**プロンプト:**
```
{{llm.output}}
```
または（LLMノードを使わない場合）:
```
{{clothing_prompt}}
```

**設定:**
- モデル: DALL-E 3 / Stable Diffusion / Midjourney
- サイズ: 1024x1024
- 品質: HD / Standard

#### 出力ノード (Output Node)

```
変数名: image_url
値: {{image_generation.output}}
または
値: {{image_generation.url}}
```

**注意:** Difyの画像生成ノードの出力フィールド名は、使用するモデルによって異なる場合があります。

### ステップ4: ワークフローを保存して公開

1. 右上の「**Save**」をクリック
2. 「**Publish**」をクリック
3. 「**API**」タブに移動

### ステップ5: API情報を取得

以下の情報をメモします：

```
API Key: app-xxxxxxxxxxxxxxxxxxxxxxxx
API Endpoint: https://api.dify.ai/v1/workflows/run
```

または、セルフホストの場合：
```
API Endpoint: https://your-domain.com/v1/workflows/run
```

---

## 2. 環境変数の設定

### ステップ1: .env.localファイルを開く

プロジェクトルートの`.env.local`ファイルを開きます。

### ステップ2: Dify設定を追加

以下を追加：

```bash
# Dify API設定
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

**完全な.env.local例:**

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Dify API設定
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

### ステップ3: サーバーを再起動

```bash
# Ctrl+C で停止
npm run dev
```

---

## 3. データベースの更新

### Supabaseで以下のSQLを実行

Supabaseダッシュボードの**SQL Editor**で実行：

```sql
-- sessionsテーブルに生成画像URL列を追加
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS generated_image_url TEXT;

-- コメントを追加
COMMENT ON COLUMN sessions.generated_image_url IS 'Difyで生成された服装画像のURL';
```

または、プロジェクトルートの`supabase_add_generated_image.sql`ファイルを実行してください。

---

## 4. 動作確認

### ステップ1: アプリにアクセス

```
http://localhost:3000
```

### ステップ2: セッションを作成

1. 「撮影をスタート」をクリック
2. ニックネーム: `テストユーザー`
3. 服装プロンプト: `赤いワンピース`
4. 「撮影開始」をクリック

### ステップ3: 画像を生成

1. カメラ画面で下にスクロール
2. 「**AI画像生成**」セクションを表示
3. 「**服装画像を生成**」ボタンをクリック
4. 数秒〜数十秒待つ
5. 生成された画像が表示される

### ステップ4: API設定を確認（デバッグ用）

ブラウザで以下にアクセス：

```
http://localhost:3000/api/generate-image
```

レスポンス例：
```json
{
  "configured": true,
  "hasApiKey": true,
  "hasEndpoint": true,
  "message": "Dify API設定済み"
}
```

---

## 5. トラブルシューティング

### エラー: "Dify API設定が不完全です"

**原因:** 環境変数が設定されていない

**解決方法:**
1. `.env.local`ファイルを確認
2. `DIFY_API_KEY`と`DIFY_API_ENDPOINT`が正しく設定されているか確認
3. サーバーを再起動（`Ctrl+C` → `npm run dev`）

### エラー: "画像URLが取得できませんでした"

**原因:** Difyワークフローの出力設定が間違っている

**解決方法:**
1. Difyワークフローの「出力ノード」を確認
2. 変数名が`image_url`になっているか確認
3. 画像生成ノードの出力が正しく接続されているか確認

**デバッグ:** サーバーログを確認：
```
Dify APIレスポンス: { ... }
```

### エラー: "Dify API error: 401"

**原因:** API Keyが無効または期限切れ

**解決方法:**
1. DifyダッシュボードでAPI Keyを再生成
2. `.env.local`を更新
3. サーバーを再起動

### エラー: "Dify API error: 500"

**原因:** Difyワークフローにエラーがある

**解決方法:**
1. Difyダッシュボードでワークフローをテスト実行
2. 各ノードが正しく接続されているか確認
3. 画像生成ノードのモデル設定を確認

### 画像生成が遅い

**原因:** 画像生成には時間がかかる（通常10〜60秒）

**対策:**
- DALL-E 3: 20〜40秒
- Stable Diffusion: 5〜15秒
- ユーザーに「生成中...」メッセージが表示されるので問題ありません

---

## 📚 Difyワークフロー例

### シンプル版（プロンプト最適化なし）

```
[入力] clothing_prompt
  ↓
[画像生成] DALL-E 3
  ↓
[出力] image_url
```

### 高度版（プロンプト最適化あり）

```
[入力] clothing_prompt
  ↓
[LLM] GPT-4でプロンプト最適化
  ↓
[画像生成] DALL-E 3
  ↓
[出力] image_url
```

### 複数画像生成版

```
[入力] clothing_prompt
  ↓
[LLM] プロンプト最適化
  ↓
[画像生成1] DALL-E 3 (スタイル1)
  ↓
[画像生成2] Stable Diffusion (スタイル2)
  ↓
[出力] image_url_1, image_url_2
```

---

## 🎨 プロンプト例

良いプロンプト例：
- ✅ `赤いワンピース、エレガント、屋外、自然光`
- ✅ `白いシャツとブルージーンズ、カジュアル、スタジオ撮影`
- ✅ `黒いスーツ、フォーマル、オフィス`

悪いプロンプト例：
- ❌ `服` (曖昧すぎる)
- ❌ `aaaa` (意味不明)

---

## 🔗 参考リンク

- [Dify公式ドキュメント](https://docs.dify.ai/)
- [Dify API Reference](https://docs.dify.ai/api-reference)
- [DALL-E 3](https://openai.com/dall-e-3)
- [Stable Diffusion](https://stability.ai/)

---

## ✅ チェックリスト

- [ ] Difyアカウントを作成
- [ ] ワークフローを作成して公開
- [ ] API KeyとEndpointを取得
- [ ] `.env.local`に設定を追加
- [ ] Supabaseでデータベース列を追加
- [ ] サーバーを再起動
- [ ] テスト画像を生成

すべてチェックが入ったら、画像生成機能が使えるようになります！🎉


