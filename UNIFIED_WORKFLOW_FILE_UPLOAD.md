# 🎯 統合ワークフロー（ファイルアップロード版）設定ガイド

## 💡 解決策

Difyの**ファイルアップロードAPI**を使用して、Base64画像データを送信します。
これにより、256文字制限を回避し、1つのワークフローで両方の処理が可能になります！

---

## 🔧 Dify ワークフロー設定

### ステップ1: Startブロック設定

**入力変数を2つ設定:**

#### 変数1: clothing_prompt（画像生成用）

```
変数名: clothing_prompt
タイプ: String / Paragraph
必須: いいえ（❌）
最大文字数: 500
```

#### 変数2: image_file（画像分析用）

```
変数名: image_file
タイプ: File ← 重要！
必須: いいえ（❌）
ファイルタイプ: Image
```

**重要:** 今回は`image_url`ではなく、`image_file`という**File型**の変数を使用します！

---

### ステップ2: 条件分岐設定

#### IF/ELSEブロックを追加

**条件:**

```
IF: clothing_prompt が空でない
  → 画像生成ルート
  
ELSE:
  → 画像分析ルート
```

---

### ステップ3: 画像生成ルート（IFブランチ）

既存の構成を維持:

```
[IF] → [LLM翻訳] → [Stability AI / DALL-E 3] → [End]
```

---

### ステップ4: 画像分析ルート（ELSEブランチ）

#### 新しいLLM Visionブロックを追加

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

プロンプト欄の下にある「画像を追加」ボタンをクリック:
- 変数を選択: `{{#start.image_file#}}`

**重要:** `image_file`（File型）を選択してください！

---

### ステップ5: Endブロック設定

**出力変数:**

```
変数1:
  変数名: image_url
  ソース: {{#stability_ai.output#}} または {{#dalle3.output#}}

変数2:
  変数名: description
  ソース: {{#llm_vision.text#}}
```

両方のルートから同じEndブロックに接続します。

---

### ステップ6: 保存して公開

1. 「保存」をクリック
2. 「公開」をクリック
3. API情報を確認（変更なし）

---

## 💻 コードの変更点

既にコードを更新しました！以下の機能が追加されています：

### 新機能: ファイルアップロード

```typescript
// Base64画像を自動的にDifyにアップロード
// → ファイルIDを取得
// → filesパラメータで送信
```

**処理の流れ:**

```
1. ユーザーが写真撮影
   ↓
2. Base64データをDifyにアップロード
   （新しいエンドポイント: /v1/files/upload）
   ↓
3. ファイルIDを取得
   ↓
4. ワークフロー実行時にfilesパラメータで送信
   {
     inputs: {},
     files: [{
       type: 'image',
       transfer_method: 'local_file',
       upload_file_id: 'xxxxx'
     }]
   }
   ↓
5. Difyワークフローでimage_fileとして受け取る
```

---

## 🚀 テスト手順

### 1. サーバーを再起動

```bash
npm run dev
```

### 2. ブラウザでテスト

```
http://localhost:3000
```

### 3. 動作確認

#### テスト1: 画像生成

1. 撮影をスタート
2. ニックネーム、服装プロンプトを入力
3. 撮影開始
4. AI画像が生成される ✅

#### テスト2: 画像分析

1. 写真を撮影
2. 自動的に画像分析が開始
3. サーバーログを確認:

```bash
画像をDifyにアップロード中...
Difyファイルアップロード成功: { id: 'xxx' }
ファイルアップロード成功、ID: xxx
Dify APIリクエスト: { inputs: {}, hasFiles: true, filesCount: 1 }
```

4. AI説明文が表示される ✅

---

## 📊 期待されるログ

### 正常な画像分析時

```bash
画像分析リクエスト: { imageDataLength: 2075638 }
Dify統合API呼び出し開始: { mode: '画像分析', apiEndpoint: 'https://api.dify.ai/v1/workflows/run' }
画像をDifyにアップロード中...
Difyファイルアップロード開始...
Difyファイルアップロード成功: { id: 'file-xxxxx', ... }
ファイルアップロード成功、ID: file-xxxxx
Dify APIリクエスト: { inputs: {}, hasFiles: true, filesCount: 1 }
Dify APIレスポンス: { data: { outputs: { description: 'この画像には...' } } }
画像分析成功: この画像には...
```

---

## 🐛 トラブルシューティング

### エラー: 「ファイルのアップロードに失敗しました」

**原因1:** ファイルアップロードエンドポイントが間違っている

**確認:**

```bash
# .env.local
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

コードが自動的に `/workflows/run` を `/files/upload` に変換します。

---

### エラー: 「File型の変数が見つかりません」

**原因:** Difyワークフローで`image_file`がFile型に設定されていない

**解決:**

1. Difyワークフローを開く
2. Startブロックで`image_file`の**タイプをFile**に変更
3. 保存・再公開

---

### エラー: 「画像分析が動かない」

**チェックリスト:**

- [ ] Difyワークフローで`image_file`がFile型になっている
- [ ] LLM Visionブロックで`{{#start.image_file#}}`を参照している
- [ ] Vision機能が有効になっている
- [ ] サーバーを再起動した
- [ ] OpenAI APIキーがDifyに設定されている

---

## 🎉 メリット

### ✅ 1つのワークフローで完結

- 画像生成と画像分析が1つのワークフローに
- 管理がシンプル
- 環境変数も2つだけ

### ✅ 文字数制限を回避

- ファイルアップロードAPI経由なので制限なし
- Base64データを直接送信可能

### ✅ 将来的に両方の出力を組み合わせやすい

ワークフローを拡張して、生成画像と撮影写真の両方を使った処理も可能：

```
[Start: prompt + image]
    ↓
[画像生成 + 画像分析]
    ↓
[比較・評価]
    ↓
[End: 総合結果]
```

---

## 📝 最終的な構成

### 環境変数（シンプル）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Dify（統合ワークフロー）
DIFY_API_KEY=app-xxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

### Difyワークフロー（1つ）

```
                [Start]
       clothing_prompt / image_file (File型)
                  ↓
              [IF/ELSE]
         ↓              ↓
    [画像生成]      [画像分析]
    [LLM翻訳]     [LLM Vision]
         ↓         (image_file使用)
   [Stability AI]      ↓
         ↓          説明文生成
         └─────[End]────┘
```

---

**これで1つのワークフローで両方の処理ができます！** 🎉

まずはDifyワークフローで`image_file`（File型）を設定してみてください！


