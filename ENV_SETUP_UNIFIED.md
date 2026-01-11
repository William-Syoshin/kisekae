# Dify 統合ワークフロー - 環境変数設定

## 🎯 統合ワークフロー用の環境変数

統合ワークフローでは、**2つの環境変数だけ**で画像生成と画像分析の両方が動作します。

---

## 📝 .env.local の設定

以下の内容で `.env.local` ファイルを設定してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Dify統合API設定（画像生成 + 画像分析）
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

---

## 🔑 各環境変数の取得方法

### 1. DIFY_API_KEY

**取得手順:**

1. Difyで統合ワークフローを作成・修正
2. ワークフローを「公開」
3. 表示される「**APIシークレットキー**」をコピー
4. `DIFY_API_KEY=` の後に貼り付け

**形式:** `app-` で始まる文字列

---

### 2. DIFY_API_ENDPOINT

**取得手順:**

1. Difyでワークフローを公開後
2. 表示される「**APIサーバー**」のURLをコピー
3. `DIFY_API_ENDPOINT=` の後に貼り付け

**通常のURL:** `https://api.dify.ai/v1/workflows/run`

---

## ⚠️ 削除する環境変数

以前の分離ワークフロー用の環境変数は**削除してください**：

```bash
# ❌ これらは削除
DIFY_ANALYZE_API_KEY=...
DIFY_ANALYZE_API_ENDPOINT=...
```

---

## ✅ 設定完了後

### サーバーを再起動

```bash
npm run dev
```

### 動作確認

1. ブラウザで `http://localhost:3000` を開く
2. 撮影開始 → AI画像生成（自動）
3. 写真撮影 → AI画像分析（自動）

---

## 🎉 シンプルになりました！

**環境変数が4つから2つに削減！**

- 以前: `DIFY_API_KEY`, `DIFY_API_ENDPOINT`, `DIFY_ANALYZE_API_KEY`, `DIFY_ANALYZE_API_ENDPOINT`
- 現在: `DIFY_API_KEY`, `DIFY_API_ENDPOINT` ✨

詳しい設定方法は `DIFY_UNIFIED_WORKFLOW_SETUP.md` を参照してください。


