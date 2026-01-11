# 🎯 2つの独立したワークフロー - 設定ガイド

**所要時間: 10-15分**

コードは既に対応済みです！Difyでの設定と環境変数の追加だけで完了します。

---

## 📋 作業の流れ

1. ✅ **ワークフロー1: 画像生成ワークフローを修正**（5分）
2. ✅ **ワークフロー2: 画像分析ワークフローを新規作成**（5分）
3. ✅ **OpenAI APIキーを取得・設定**（3分）
4. ✅ **環境変数を追加**（2分）
5. ✅ **サーバー再起動・テスト**（1分）

---

## 🔧 ステップ1: 画像生成ワークフローを修正

### 目的

Stability AI（クレジット不足）→ DALL-E 3に変更

### 手順

#### 1. Difyダッシュボードを開く

```
https://dify.ai/
```

#### 2. 既存の画像生成ワークフローを開く

既に作成済みのワークフローを開いてください。

#### 3. Stability AIブロックを削除

- Stability AIブロックを選択
- 削除

#### 4. DALL-E 3ツールブロックを追加

**左サイドバーから:**
- 「**ツール**」をドラッグ
- ツールを選択: **DALL-E 3**

**接続:**

```
[LLM翻訳] → [DALL-E 3] → [End]
```

#### 5. DALL-E 3の設定

| 設定項目 | 値 |
|---------|---|
| **プロンプト** | `{{#llm_translation.text#}}` |
| **サイズ** | `1024x1024` |
| **品質** | `standard` |
| **スタイル** | `vivid` |

#### 6. Endブロックを修正

**出力変数:**

```
変数名: image_url
ソース: {{#dalle3.output#}} または {{#dalle3.image_url#}}
```

**重要:** DALL-E 3の出力変数名を確認してください（通常は`output`または`image_url`）

#### 7. 保存・再公開

1. 「**保存**」をクリック
2. 「**公開**」をクリック

#### 8. API情報を確認

既存の情報をそのまま使用：

```
APIシークレットキー: app-xxxxxxxxxxxxxxxxxxxxxx
APIサーバー: https://api.dify.ai/v1/workflows/run
```

これらは既に `.env.local` に設定済みなので、変更不要です。

---

## 🆕 ステップ2: 画像分析ワークフローを新規作成

### 目的

撮影した写真をAIが分析して説明文を生成

### 手順

#### 1. 新しいワークフローを作成

```
Dify → 「ワークフローを作成」をクリック
```

**設定:**
- 名前: `画像分析` または `Image Analysis`
- タイプ: ワークフロー

#### 2. ブロック構成（シンプル）

```
[Start] → [LLM] → [End]
```

3つのブロックだけ！

#### 3. Startブロック設定

**入力変数を1つ追加:**

```
変数名: image_file
タイプ: File ← 重要！
必須: ✅ はい
ファイルタイプ: Image
説明: 分析する画像
```

**重要:** `String`ではなく`File`型を選択してください！

#### 4. LLMブロックを追加

**左サイドバーから「LLM」をドラッグ**

**モデル設定:**

```
プロバイダー: OpenAI
モデル: gpt-4o-mini
Temperature: 0.7
Max Tokens: 500
```

#### 5. Vision機能を有効化

**重要:** ✅ Vision機能を有効にする

#### 6. プロンプト設定

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

#### 7. 画像入力を設定

プロンプト入力欄の下にある**「画像を追加」**ボタンをクリック:

- 変数を選択: `{{#start.image_file#}}`

**確認:** 画像アイコンが表示されていればOK

#### 8. Endブロックを設定

**出力変数:**

```
変数名: description
タイプ: String
ソース: {{#llm.text#}}
```

#### 9. ブロックを接続

```
[Start]の右側 → [LLM]の左側
[LLM]の右側 → [End]の左側
```

#### 10. 保存・公開

1. 「**保存**」をクリック
2. 「**公開**」をクリック

#### 11. API情報をコピー

**重要:** 以下の情報をコピーしてください：

```
APIシークレットキー: app-yyyyyyyyyyyyyyyy
APIサーバー: https://api.dify.ai/v1/workflows/run
```

---

## 🔐 ステップ3: OpenAI APIキーを取得・設定

### OpenAI APIキーを取得

#### 1. OpenAI Platform にアクセス

```
https://platform.openai.com/
```

#### 2. ログイン

既存のアカウントでログイン（なければ新規登録）

#### 3. APIキーを作成

```
左サイドバー → API keys → Create new secret key
```

**設定:**
- 名前: `Dify Image Generation and Analysis`
- 権限: 全権限（デフォルト）

#### 4. APIキーをコピー

**重要:** 表示されたAPIキーをコピー（後で確認できないので注意）

例: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 5. クレジットを確認

```
https://platform.openai.com/account/billing
```

- 新規アカウント: $5の無料クレジット
- 既存アカウント: クレジットをチャージ

**コスト目安:**
- DALL-E 3: $0.04/画像
- GPT-4o-mini Vision: $0.001-0.002/分析
- **合計: 約$0.04/回**

### Difyに設定

#### 1. Difyの設定を開く

```
Dify → 左サイドバー → 設定 → モデルプロバイダー
```

#### 2. OpenAIを選択

```
OpenAI → APIキーを入力 → 保存
```

**注意:** この設定は両方のワークフローで共有されます。

---

## 📝 ステップ4: 環境変数を追加

### `.env.local` ファイルを編集

プロジェクトルートの `.env.local` ファイルを開いて、以下を追加してください：

#### 追加する内容

```bash
# Dify 画像分析API（新規追加）
DIFY_ANALYZE_API_KEY=app-yyyyyyyyyyyyyyyy
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

**`app-yyyyyyyyyyyyyyyy`の部分を、ステップ2-11でコピーしたAPIキーに置き換えてください。**

#### 最終的な `.env.local` の内容

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Dify 画像生成API
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run

# Dify 画像分析API（新規追加）
DIFY_ANALYZE_API_KEY=app-yyyyyyyyyyyyyyyy
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

---

## 🚀 ステップ5: サーバーを再起動

### ターミナルで実行

```bash
cd /Users/yuchenzhou/Desktop/kisekae

# 既に起動している場合は停止（Ctrl + C）
# そして再起動
npm run dev
```

### 起動確認

以下のようなメッセージが出ればOK：

```
> camera-capture-app@2.0.0 dev
> next dev

  ▲ Next.js 15.5.9
  - Local:        http://localhost:3000

✓ Ready in 1.5s
```

---

## ✅ ステップ6: 動作テスト

### ブラウザを開く

```
http://localhost:3000
```

### テスト1: 画像生成

1. 「**撮影をスタート**」をクリック

2. **フォーム入力:**
   ```
   ニックネーム: テスト
   服装プロンプト: 赤いワンピース、エレガント
   ```

3. 「**撮影開始**」をクリック

4. **期待される動作:**
   - カメラが起動
   - 「AI画像を生成中...」と表示
   - 15-30秒後、生成画像が表示される ✅

5. **サーバーログを確認:**

```bash
画像生成リクエスト: { clothing_prompt: '赤いワンピース、エレガント', session_id: 1 }
Dify API呼び出し開始: { clothingPrompt: '...' }
Dify APIレスポンス: { data: { outputs: { image_url: 'https://...' } } }
画像生成成功: https://...
```

### テスト2: 画像分析

1. **写真を撮影**
   - 「撮影する」ボタンをクリック
   - またはスペースキーを押す

2. **期待される動作:**
   - 「写真がデータベースに保存されました！」
   - 「AIが画像を分析中...」と表示
   - 10-20秒後、説明文が表示される ✅

3. **サーバーログを確認:**

```bash
画像分析リクエスト: { imageDataLength: 2075638 }
画像をDifyにアップロード中...
Difyファイルアップロード成功: { id: 'file-xxxxx' }
ファイルアップロード成功、ID: file-xxxxx
Dify APIリクエスト: { inputs: [], hasFiles: true, filesCount: 1 }
Dify APIレスポンス: { data: { outputs: { description: 'この画像には...' } } }
画像分析成功: この画像には...
```

---

## 🎉 完成！

### 最終的な構成

#### 環境変数（4つ）

```bash
DIFY_API_KEY              # 画像生成用
DIFY_API_ENDPOINT         # 画像生成用
DIFY_ANALYZE_API_KEY      # 画像分析用
DIFY_ANALYZE_API_ENDPOINT # 画像分析用
```

#### Difyワークフロー（2つ）

```
1. 画像生成ワークフロー
   [Start: clothing_prompt] → [LLM翻訳] → [DALL-E 3] → [End: image_url]

2. 画像分析ワークフロー
   [Start: image_file] → [LLM Vision] → [End: description]
```

---

## 📋 チェックリスト

### 画像生成ワークフロー

- [ ] Difyで既存ワークフローを開いた
- [ ] Stability AIブロックを削除
- [ ] DALL-E 3ブロックを追加
- [ ] Endブロックを修正
- [ ] 保存・再公開

### 画像分析ワークフロー

- [ ] 新しいワークフローを作成
- [ ] Startブロックに`image_file`（File型）を追加
- [ ] LLM Visionブロックを追加
- [ ] Vision機能を有効化
- [ ] プロンプトを設定
- [ ] 画像入力に`{{#start.image_file#}}`を設定
- [ ] Endブロックで`description`を出力
- [ ] 保存・公開
- [ ] APIキーをコピー

### OpenAI

- [ ] OpenAI APIキーを取得
- [ ] Difyに設定
- [ ] クレジットを確認

### 環境変数

- [ ] `.env.local`を開いた
- [ ] `DIFY_ANALYZE_API_KEY`を追加
- [ ] `DIFY_ANALYZE_API_ENDPOINT`を追加
- [ ] ファイルを保存

### サーバー

- [ ] サーバーを再起動
- [ ] ブラウザでテスト
- [ ] 画像生成が成功
- [ ] 画像分析が成功

---

## 🐛 トラブルシューティング

### エラー: 「Dify 画像分析API設定が不完全です」

**原因:** `.env.local`の設定が不足

**解決:**

```bash
# .env.localを確認
cat .env.local

# DIFY_ANALYZE_API_KEYとDIFY_ANALYZE_API_ENDPOINTがあるか確認
# なければ追加

# サーバー再起動
npm run dev
```

### エラー: 「画像生成に失敗しました」

**原因1:** OpenAI APIキーが設定されていない

**解決:** Difyでモデルプロバイダー設定を確認

**原因2:** OpenAIクレジット不足

**解決:** https://platform.openai.com/account/billing でチャージ

### エラー: 「画像分析に失敗しました」

**原因1:** `image_file`がFile型になっていない

**解決:** Difyワークフローで`image_file`の型を`File`に変更

**原因2:** Vision機能が無効

**解決:** LLMブロックでVision機能を有効化

---

## 💰 コスト見積もり

### 1回の使用（画像生成 + 撮影 + 分析）

- DALL-E 3: $0.04
- GPT-4o-mini Vision: $0.001-0.002
- **合計: 約$0.04/回**

### 100回使用

- **約$4**

### 1000回使用

- **約$40**

非常にリーズナブルです！✨

---

**設定完了したら、テスト結果を教えてください！** 🚀


