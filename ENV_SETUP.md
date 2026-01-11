# 🔐 環境変数設定ガイド

このアプリケーションで使用するすべての環境変数の設定方法です。

---

## 📝 .env.local ファイル

プロジェクトルートに `.env.local` ファイルを作成してください。

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replicate設定（AI画像生成・Virtual Try-on用）
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Dify設定（プロンプト翻訳用）- オプション
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1
```

---

## 🔑 各環境変数の取得方法

### 1. Supabase（必須）

**用途**: データベース・ストレージ

#### 取得方法:
1. [https://supabase.com/](https://supabase.com/) でプロジェクト作成
2. Settings → API で取得

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

📚 詳細: `SUPABASE_SETUP.md` を参照

---

### 2. Replicate（必須）

**用途**: AI画像生成（Flux Schnell）、Virtual Try-on（Kolors）

#### 取得方法:
1. [https://replicate.com/](https://replicate.com/) でアカウント作成
2. Account Settings → API tokens で作成

```bash
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**コスト**:
- Flux Schnell: $0.003/画像
- Kolors VTON: $0.02/画像

📚 詳細: `REPLICATE_UNIFIED_GUIDE.md` を参照

---

### 3. Dify（オプション - 推奨）

**用途**: 日本語→英語プロンプト翻訳・最適化

#### 取得方法:
1. [https://cloud.dify.ai/](https://cloud.dify.ai/) でアカウント作成
2. ワークフローを作成・公開
3. API管理でAPIキーを取得

```bash
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1
```

**自己ホスト版の場合**:
```bash
DIFY_API_ENDPOINT=http://localhost/v1
```

📚 詳細: `DIFY_PROMPT_TRANSLATOR_SETUP.md` を参照

**注意**: Difyが未設定の場合、シンプルな英語テンプレートが使用されます（機能は動作します）

---

## ✅ 設定確認

### 環境変数が正しく読み込まれているか確認

```bash
npm run dev
```

ブラウザで以下にアクセス:

1. **Replicate**: [http://localhost:3000/api/generate-image-flux](http://localhost:3000/api/generate-image-flux)
   - `configured: true` なら設定OK

2. **Dify**: [http://localhost:3000/api/translate-prompt](http://localhost:3000/api/translate-prompt)
   - `configured: true` なら設定OK
   - `configured: false` でもアプリは動作します

---

## 🔒 セキュリティ

### .gitignoreの確認

`.env.local` が `.gitignore` に含まれていることを確認:

```bash
cat .gitignore | grep .env.local
```

### APIキーの管理

- ✅ APIキーは絶対にGitHubにpushしない
- ✅ `.env.local` ファイルは各開発者が個別に作成
- ✅ 本番環境では環境変数で設定（Vercel、Netlifyなど）

---

## 🚀 デプロイ時の設定

### Vercelの場合

1. プロジェクト設定 → Environment Variables
2. 各環境変数を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `REPLICATE_API_TOKEN`
   - `DIFY_API_KEY`（オプション）
   - `DIFY_API_ENDPOINT`（オプション）

### Netlifyの場合

1. Site settings → Environment variables
2. 同様に設定

---

## 📊 必須度まとめ

| 環境変数 | 必須度 | 用途 | 未設定時の動作 |
|---------|--------|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 必須 | データベース | アプリが動作しない |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 必須 | データベース | アプリが動作しない |
| `REPLICATE_API_TOKEN` | ✅ 必須 | AI生成 | 画像生成・着せ替えが動作しない |
| `DIFY_API_KEY` | ⭐ 推奨 | プロンプト翻訳 | シンプルなテンプレート使用 |
| `DIFY_API_ENDPOINT` | ⚪ オプション | Difyエンドポイント | デフォルト値使用 |

---

## 🔄 .env.local テンプレート

```bash
# ===========================================
# 環境変数設定
# ===========================================

# ----- Supabase（必須）-----
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ----- Replicate（必須）-----
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ----- Dify（オプション - 推奨）-----
# 日本語プロンプトを英語に翻訳・最適化
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1

# 注意:
# - このファイルは .gitignore に含まれています
# - APIキーは絶対にGitHubにpushしないでください
# - 本番環境では環境変数で設定してください
```

---

**作成日**: 2026-01-11  
**バージョン**: 1.0

