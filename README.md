# 📷 Virtual Try-on アプリ (Next.js + TypeScript + Supabase + Replicate)

Next.js、TypeScript、Supabaseを使用したVirtual Try-onアプリケーション。AI画像生成と着せ替え機能を備えています。

## ✨ 主要機能

- 🎬 **セッションベース** - ニックネームと服装プロンプトで撮影セッションを作成
- 👤 **ニックネーム管理** - 各撮影者を識別
- 👔 **服装プロンプト** - 撮影時の服装情報を記録
- 🎨 **AI画像生成** - Flux Schnellで服装プロンプトから画像を生成
- 👕 **Virtual Try-on** - Kolorsモデルで着せ替え機能
- 📸 **写真の紐付け** - セッションと写真を関連付けて管理
- 🖼️ **セッション別ギャラリー** - セッションごとにグループ化して表示
- ✏️ **プロンプト編集** - 英語プロンプトを直接編集可能

## 🎯 使い方の流れ

### 1. スタート画面
- **「撮影をスタート」ボタン**をクリック

### 2. 情報入力画面
- **ニックネーム**を入力（例: Yuki）
- **服装の説明**を入力（日本語OK、例: 赤いワンピース）
- **詳細プロンプトを編集**（オプション）で英語プロンプトをカスタマイズ
- **「撮影開始」ボタン**をクリック

### 3. 撮影画面
- カメラが自動的に起動
- AI画像が自動生成される
- プロンプトを編集して再生成可能
- **「撮影する」ボタン**またはスペースキーで撮影
- **Virtual Try-on**ボタンで着せ替え

### 4. ギャラリー画面
- セッション別に写真を表示
- 各セッションのニックネームと服装プロンプトを確認可能

## 📊 データベース構造

### sessionsテーブル
```sql
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  clothing_prompt TEXT NOT NULL,
  generated_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### photosテーブル
```sql
CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  storage_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 セットアップ

### 1. Supabaseデータベースのマイグレーション

**重要**: まず既存のデータをバックアップしてください！

Supabaseの**SQL Editor**で`supabase_migration.sql`の内容を実行：

```sql
-- セッションテーブルを作成
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  clothing_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存のphotosテーブルを削除（バックアップしてから実行）
DROP TABLE IF EXISTS photos;

-- 新しいphotosテーブルを作成
CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  storage_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX idx_photos_session_id ON photos(session_id);
CREATE INDEX idx_photos_timestamp ON photos(timestamp DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- RLSを無効化（開発環境用）
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
```

### 2. 環境変数の設定

`.env.local`ファイルを作成：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Replicate設定（AI画像生成・Virtual Try-on用）
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replicateのセットアップ:**
1. [Replicate](https://replicate.com/)でアカウント作成
2. APIトークンを取得
3. `.env.local`に設定

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📁 プロジェクト構造

```
kisekae/
├── app/
│   ├── api/
│   │   ├── session/
│   │   │   └── route.ts              # セッション作成・取得API
│   │   ├── upload/
│   │   │   └── route.ts              # 画像アップロードAPI
│   │   ├── photos/
│   │   │   └── route.ts              # 写真一覧取得API
│   │   ├── generate-image-flux/
│   │   │   └── route.ts              # Flux画像生成API
│   │   └── virtual-tryon/
│   │       └── route.ts              # Virtual Try-on API
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # メインページ
│   └── globals.css                   # グローバルスタイル
├── components/
│   └── CameraCapture.tsx             # メインコンポーネント（4画面）
├── lib/
│   ├── supabase.ts                   # Supabaseクライアント
│   ├── image-generation.ts           # Flux画像生成
│   └── virtual-tryon.ts              # Virtual Try-on処理
├── types/
│   └── database.ts                   # 型定義（Session, Photo）
├── supabase_migration.sql            # データベースマイグレーションSQL
└── package.json
```

## 🎨 画面構成

### 1. **スタート画面** (`appState: 'start'`)
- 「撮影をスタート」ボタン

### 2. **フォーム画面** (`appState: 'form'`)
- ニックネーム入力
- 服装プロンプト入力（最大200文字）
- 送信ボタン

### 3. **カメラ画面** (`appState: 'camera'`)
- セッション情報表示（ニックネーム + 服装プロンプト）
- ビデオプレビュー
- 撮影ボタン
- 新規セッションボタン
- ギャラリーボタン

### 4. **ギャラリー画面** (`appState: 'gallery'`)
- セッション別に写真をグループ化
- 各セッションの情報を表示
- 写真クリックで拡大表示

## 📝 API エンドポイント

### `POST /api/session`
セッションを作成

**リクエスト:**
```json
{
  "nickname": "Yuki",
  "clothing_prompt": "赤いワンピース"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "セッションが作成されました！",
  "session": {
    "id": 1,
    "nickname": "Yuki",
    "clothing_prompt": "赤いワンピース",
    "created_at": "2026-01-10T12:00:00Z"
  }
}
```

### `GET /api/session`
セッション一覧を取得

### `POST /api/upload`
写真をアップロード（session_idと紐付け）

**リクエスト:**
```json
{
  "image": "data:image/png;base64,...",
  "session_id": 1
}
```

### `GET /api/photos`
写真一覧を取得（セッション情報付き）

### `GET /api/photos?session_id=1`
特定セッションの写真を取得

## 🔧 主要機能

### セッション管理
- ニックネームと服装プロンプトでセッションを作成
- セッションIDで写真を紐付け
- セッション別にギャラリー表示

### 写真撮影
- WebRTC APIでカメラアクセス
- リアルタイムプレビュー
- スペースキーショートカット
- セッション情報の常時表示

### データ保存
- ローカルファイル（`public/uploads/`）
- Supabase Storage（クラウド）
- Supabase Database（メタデータ + セッション紐付け）

## 🐛 トラブルシューティング

### マイグレーションエラー
```sql
-- 既存のphotosテーブルが外部キー制約で削除できない場合
DROP TABLE IF EXISTS photos CASCADE;
```

### セッションが作成できない
- `.env.local`の設定を確認
- Supabaseでsessionsテーブルが作成されているか確認
- ブラウザのコンソールでエラーを確認

### 写真がセッションに紐付かない
- session_idが正しく渡されているか確認
- photosテーブルの外部キー制約を確認

## 📚 技術スタック

- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Supabase** - データベース + ストレージ
- **Replicate** - AI画像生成・Virtual Try-on
  - **Flux Schnell** - 高速画像生成モデル
  - **Kolors Virtual Try-on** - 着せ替えモデル
- **WebRTC** - カメラアクセス

## 📄 ライセンス

ISC

## 👤 作成者

2026

---

## 🔄 データベースの変更点

### 旧構造
```
photos (id, filename, filepath, storage_url, timestamp)
```

### 新構造
```
sessions (id, nickname, clothing_prompt, created_at)
photos (id, session_id, filename, filepath, storage_url, timestamp)
```

**外部キー**: `photos.session_id` → `sessions.id` (CASCADE DELETE)
