# 🚨 エラー修正：画像分析ワークフローの作り直し

## エラー内容

```
"code":"not_workflow_app"
"message":"Please check if your app mode matches the right API route."
```

## 原因

画像分析を**ワークフロー**ではなく、**Chatbot/Agent**で作成している可能性があります。

---

## 🔧 解決方法：ワークフローで作り直す

### ステップ1: Difyで新しいワークフローを作成

#### 1. Difyダッシュボードを開く

```
https://dify.ai/
```

#### 2. 「アプリを作成」または「Create App」をクリック

#### 3. **重要: 「ワークフロー」を選択**

```
[ワークフロー] ← これを選択！
```

**間違い:** Chatbot, Agent, その他

#### 4. 名前を設定

```
名前: 画像分析
または: Image Analysis
```

---

### ステップ2: ワークフローを構築

#### ブロック構成

```
[Start] → [LLM] → [End]
```

#### Startブロック

**入力変数:**

```
変数名: image_file
タイプ: File
必須: はい
ファイルタイプ: Image
```

#### LLMブロック

**設定:**

```
プロバイダー: OpenAI
モデル: gpt-4o-mini
Temperature: 0.7
Max Tokens: 500
Vision: ✅ 有効化必須
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

#### Endブロック

```
変数名: description
ソース: {{#llm.text#}}
```

---

### ステップ3: 接続

```
[Start]の右側 → [LLM]の左側
[LLM]の右側 → [End]の左側
```

---

### ステップ4: 保存・公開

1. 「保存」をクリック
2. 「公開」をクリック

---

### ステップ5: API情報を取得

公開後、以下が表示されます：

```
APIシークレットキー: app-新しいキー
APIサーバー: https://api.dify.ai/v1/workflows/run
```

**重要:** エンドポイントが`/workflows/run`で終わることを確認！

---

### ステップ6: 環境変数を更新

`.env.local`を開いて、`DIFY_ANALYZE_API_KEY`を更新：

```bash
# Dify 画像分析API
DIFY_ANALYZE_API_KEY=app-新しいAPIキー
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

---

### ステップ7: サーバーを再起動

```bash
npm run dev
```

---

## ✅ 確認ポイント

### Difyで確認

1. **ワークフローとして作成されているか**
   - ダッシュボードでアプリを開く
   - 上部に「ワークフロー」と表示されているか確認

2. **APIエンドポイントを確認**
   - 公開後の画面で確認
   - `/workflows/run`で終わっているか

### `.env.local`で確認

```bash
DIFY_ANALYZE_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
                                                  ^^^^^^^^^^^^
                                                  これが重要！
```

---

## 🎯 期待される動作

修正後、サーバーログに以下が表示されるはずです：

```bash
画像をDifyにアップロード中...
Difyファイルアップロード成功: { id: 'file-xxxxx' }
ファイルアップロード成功、ID: file-xxxxx
Dify 画像分析APIリクエスト: { hasInputs: true, hasFiles: true, filesCount: 1 }
Dify 画像分析APIレスポンス: { data: { outputs: { description: '...' } } }
画像分析成功: この画像には...
```

---

## 🆘 それでもエラーが出る場合

### エラー: 「DIFY_ANALYZE_API_KEYが設定されていません」

**原因:** 環境変数が読み込まれていない

**解決:**
1. `.env.local`のファイル名を確認（`.env`ではない）
2. サーバーを完全に再起動
3. ブラウザをリフレッシュ

### エラー: 「Visionがサポートされていません」

**原因:** LLMブロックでVision機能が無効

**解決:**
1. Difyワークフローを開く
2. LLMブロックを選択
3. Vision機能を有効化
4. 保存・再公開

---

## 📋 チェックリスト

- [ ] Difyで「ワークフロー」として新規作成
- [ ] Startブロックに`image_file`（File型）を追加
- [ ] LLMブロックを追加（gpt-4o-mini）
- [ ] Vision機能を有効化
- [ ] 画像入力に`{{#start.image_file#}}`を設定
- [ ] Endブロックで`description`を出力
- [ ] ブロックを接続
- [ ] 保存・公開
- [ ] APIキーをコピー
- [ ] `.env.local`に`DIFY_ANALYZE_API_KEY`を設定
- [ ] エンドポイントが`/workflows/run`であることを確認
- [ ] サーバーを再起動
- [ ] ブラウザでテスト

---

**ワークフローとして作り直してください！** 🚀


