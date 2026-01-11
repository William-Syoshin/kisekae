# 🎯 画像分析専用ワークフロー作成ガイド（簡易版）

## 問題
統合ワークフローでは`image_url`の文字数制限（256文字）により、Base64画像データを送れない。

## 解決策
画像分析用の**独立したワークフロー**を新規作成する。

---

## 📋 作成手順（5分で完了）

### ステップ1: 新しいワークフローを作成

1. **Difyダッシュボード**を開く
   ```
   https://dify.ai/
   ```

2. **「ワークフローを作成」**をクリック

3. **名前:** `画像分析` または `Image Analysis`

4. **タイプ:** ワークフロー

---

### ステップ2: ブロック構成（シンプル）

```
[Start] → [LLM] → [End]
```

3つのブロックだけ！

---

### ステップ3: Startブロック設定

**入力変数を1つだけ追加:**

```
変数名: image_url
タイプ: Paragraph
必須: ✅ はい
最大文字数: 256（そのままでOK - 実際には無視される）
説明: 分析する画像のBase64データ
```

**重要:** タイプは`Paragraph`にしてください。
**注意:** DifyのAPIでは、この制限は実際には適用されないことが多いです。

---

### ステップ4: LLMブロック設定

#### 1. LLMブロックを追加

左サイドバーから「**LLM**」をドラッグ

#### 2. モデルを選択

```
プロバイダー: OpenAI
モデル: gpt-4o-mini
Temperature: 0.7
Max Tokens: 500
```

#### 3. Vision機能を有効化

**重要:** ✅ Vision機能を有効にする

#### 4. プロンプト設定

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

#### 5. 画像を追加

プロンプト入力欄の下にある**「画像を追加」**ボタンをクリック:
- 変数を選択: `{{#start.image_url#}}`

---

### ステップ5: Endブロック設定

**出力変数:**

```
変数名: description
タイプ: String
ソース: {{#llm.text#}}
```

---

### ステップ6: ブロックを接続

```
[Start] → [LLM] → [End]
```

1. Startの右側 → LLMの左側
2. LLMの右側 → Endの左側

---

### ステップ7: テスト（スキップ可）

「実行」ボタンで動作確認（オプション）

---

### ステップ8: 公開してAPI情報を取得

1. **「保存」**をクリック

2. **「公開」**をクリック

3. **API情報をコピー:**

```
APIシークレットキー: app-yyyyyyyyyyyyyyyy
APIサーバー: https://api.dify.ai/v1/workflows/run
```

---

## 🔐 環境変数を設定

### `.env.local` ファイルを更新

既存の設定に**追加**してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Dify 画像生成API（既存）
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run

# Dify 画像分析API（新規追加）
DIFY_ANALYZE_API_KEY=app-yyyyyyyyyyyyyyyy
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

**注意:**
- 画像生成と画像分析で**異なるAPIキー**を使用
- エンドポイントは同じ`/workflows/run`

---

## 🚀 完了！

### サーバーを再起動

```bash
npm run dev
```

### ブラウザでテスト

```
http://localhost:3000
```

---

## ✅ 動作確認

### 期待される動作

1. **画像生成:**
   - 撮影開始 → AI画像が自動生成される

2. **画像分析:**
   - 写真撮影 → AI説明文が自動表示される

---

## 🎉 完成！

これで2つのワークフローが独立して動作します：

```
Dify アカウント
├── ワークフロー1: 画像生成
│   └── API Key: DIFY_API_KEY
│
└── ワークフロー2: 画像分析（新規）
    └── API Key: DIFY_ANALYZE_API_KEY
```

簡単で確実な方法です！✨


