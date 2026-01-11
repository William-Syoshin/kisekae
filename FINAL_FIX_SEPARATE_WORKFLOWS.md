# 🚨 緊急修正：2つの独立したワークフローへの移行

## 現在の問題

1. **Stability AIクレジット不足**
2. **統合ワークフローの条件分岐が複雑すぎる**
3. 画像生成と画像分析の両方が失敗

## 解決策：シンプルに戻す

2つの独立したワークフローに分けることで、確実に動作させます。

---

## 📋 実装手順（10分で完了）

### ステップ1: 既存の画像生成ワークフローを確認

**現在の画像生成ワークフロー:**
- API Key: `DIFY_API_KEY`（既に.env.localに設定済み）
- エンドポイント: `DIFY_API_ENDPOINT`

**修正点: Stability AI → DALL-E 3に変更**

#### 1. Difyでワークフローを開く

#### 2. Stability AIブロックを削除

#### 3. DALL-E 3ブロックを追加

```
[LLM翻訳] → [DALL-E 3ツール] → [End]
```

**DALL-E 3の設定:**

```
プロンプト: {{#llm_translation.text#}}
サイズ: 1024x1024
品質: standard
```

#### 4. OpenAI APIキーを設定

```
Dify → 設定 → モデルプロバイダー → OpenAI
→ APIキーを入力 → 保存
```

#### 5. Endブロックを修正

```
出力変数: image_url
ソース: {{#dalle3.output#}}
```

#### 6. 保存・再公開

---

### ステップ2: 新しい画像分析ワークフローを作成

#### 1. 新しいワークフローを作成

```
Dify → ワークフローを作成
名前: 画像分析
```

#### 2. ブロック構成（シンプル）

```
[Start] → [LLM Vision] → [End]
```

#### 3. Startブロック

**入力変数:**

```
変数名: image_file
タイプ: File
必須: はい
ファイルタイプ: Image
```

#### 4. LLM Visionブロック

**設定:**

```
プロバイダー: OpenAI
モデル: gpt-4o-mini
Temperature: 0.7
Max Tokens: 500
Vision: ✅ 有効
```

**System Prompt:**

```
あなたは画像を詳しく分析する専門家です。
与えられた画像を分析し、以下の観点から詳細に説明してください：

1. 全体的な印象
2. 服装・ファッション
3. 色使い
4. スタイル・雰囲気
5. その他の特徴

説明は日本語で、200〜300文字程度で自然な文章として出力してください。
```

**User Prompt:**

```
この画像を分析して、詳しく説明してください。
```

**画像入力:**
- 「画像を追加」→ `{{#start.image_file#}}` を選択

#### 5. Endブロック

```
出力変数: description
ソース: {{#llm_vision.text#}}
```

#### 6. 接続

```
[Start] → [LLM Vision] → [End]
```

#### 7. 保存・公開

APIキーとエンドポイントをコピー

---

### ステップ3: 環境変数を更新

`.env.local` ファイルを以下のように更新：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Dify 画像生成API
DIFY_API_KEY=app-画像生成ワークフローのキー
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run

# Dify 画像分析API（新規追加）
DIFY_ANALYZE_API_KEY=app-画像分析ワークフローのキー
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

---

### ステップ4: OpenAI APIキーを取得・設定

#### APIキーを取得

```
https://platform.openai.com/
→ API keys
→ Create new secret key
```

#### Difyに設定

```
Dify → 設定 → モデルプロバイダー → OpenAI
→ APIキーを入力 → 保存
```

**重要:** 両方のワークフローで同じOpenAI APIキーを使用できます。

#### OpenAIクレジットの確認

```
https://platform.openai.com/account/billing
```

新規アカウントには$5の無料クレジットがあります。

**コスト目安:**
- DALL-E 3: $0.04/画像（1024x1024, standard品質）
- GPT-4o-mini Vision: $0.001-0.002/画像分析

---

### ステップ5: サーバーを再起動

```bash
cd /Users/yuchenzhou/Desktop/kisekae
npm run dev
```

---

## ✅ 動作確認

### 期待されるログ

#### 画像生成時

```bash
画像生成リクエスト: { clothing_prompt: '...', session_id: 1 }
Dify API呼び出し開始: { clothingPrompt: '...' }
Dify APIレスポンス: { data: { outputs: { image_url: 'https://...' } } }
画像生成成功: https://...
```

#### 画像分析時

```bash
画像分析リクエスト: { imageDataLength: 2075638 }
画像をDifyにアップロード中...
Difyファイルアップロード成功: { id: 'file-xxxxx' }
ファイルアップロード成功、ID: file-xxxxx
Dify APIリクエスト: { inputs: [], hasFiles: true, filesCount: 1 }
Dify APIレスポンス: { data: { outputs: { description: '...' } } }
画像分析成功: この画像には...
```

---

## 🎉 完成後の構成

### 環境変数（4つ）

```bash
DIFY_API_KEY              # 画像生成用
DIFY_API_ENDPOINT         # 画像生成用
DIFY_ANALYZE_API_KEY      # 画像分析用
DIFY_ANALYZE_API_ENDPOINT # 画像分析用
```

### Difyワークフロー（2つ）

```
1. 画像生成ワークフロー
   [Start: clothing_prompt] → [LLM翻訳] → [DALL-E 3] → [End: image_url]

2. 画像分析ワークフロー
   [Start: image_file] → [LLM Vision] → [End: description]
```

### コスト

- DALL-E 3: $0.04/画像
- GPT-4o-mini Vision: $0.001/分析
- **合計: 約$0.041/回**（画像生成+分析）

100回使用しても**約$4.10**です。

---

## 📋 チェックリスト

### 画像生成ワークフロー

- [ ] Difyで既存のワークフローを開いた
- [ ] Stability AIブロックを削除
- [ ] DALL-E 3ブロックを追加
- [ ] OpenAI APIキーをDifyに設定
- [ ] Endブロックを修正（`{{#dalle3.output#}}`）
- [ ] 保存・再公開

### 画像分析ワークフロー

- [ ] 新しいワークフローを作成
- [ ] Startブロックに`image_file`（File型）を追加
- [ ] LLM Visionブロックを追加・設定
- [ ] Vision機能を有効化
- [ ] 画像入力に`{{#start.image_file#}}`を設定
- [ ] Endブロックで`description`を出力
- [ ] 保存・公開

### 環境変数

- [ ] `.env.local`に`DIFY_ANALYZE_API_KEY`を追加
- [ ] `.env.local`に`DIFY_ANALYZE_API_ENDPOINT`を追加

### OpenAI

- [ ] OpenAI APIキーを取得
- [ ] Difyに設定
- [ ] クレジットを確認

### サーバー

- [ ] サーバーを再起動
- [ ] ブラウザでテスト
- [ ] ログを確認

---

## 🚀 これで確実に動きます！

シンプルで確実な構成です。
統合ワークフローは複雑すぎたため、独立したワークフローに分けることで、
デバッグもメンテナンスも簡単になります。

何か問題があれば教えてください！


