# Supabaseセットアップガイド

このガイドでは、Supabaseプロジェクトのセットアップ手順を詳しく説明します。

## 1. Supabaseプロジェクトの作成

1. [https://supabase.com/](https://supabase.com/) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインイン
4. 「New project」をクリック
5. 以下の情報を入力：
   - **Name**: `camera-app`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（保管してください）
   - **Region**: `Northeast Asia (Tokyo)`（日本の場合）
6. 「Create new project」をクリック

プロジェクトの初期化には1〜2分かかります。

## 2. 認証情報の取得

1. プロジェクトダッシュボードの左サイドバーから「Settings」→「API」をクリック
2. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（長い文字列）

## 3. データベーステーブルの作成

1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLをコピー＆ペーストして実行：

```sql
-- photosテーブルを作成
CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  storage_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX idx_photos_timestamp ON photos(timestamp DESC);

-- コメントを追加
COMMENT ON TABLE photos IS 'カメラで撮影した写真のメタデータ';
COMMENT ON COLUMN photos.id IS '一意のID';
COMMENT ON COLUMN photos.filename IS 'ファイル名';
COMMENT ON COLUMN photos.filepath IS 'ローカルファイルパス';
COMMENT ON COLUMN photos.storage_url IS 'Supabase Storage公開URL';
COMMENT ON COLUMN photos.timestamp IS '撮影日時';
```

4. 「RUN」ボタンをクリックして実行
5. 「Success. No rows returned」と表示されればOK

## 4. Storageバケットの作成

1. 左サイドバーから「Storage」をクリック
2. 「Create a new bucket」をクリック
3. 以下の情報を入力：
   - **Name**: `photos`
   - **Public bucket**: **ON**（チェックを入れる）
   - **Allowed MIME types**: 空欄でOK
   - **File size limit**: `10`（MB）
4. 「Create bucket」をクリック

## 5. .envファイルの作成

プロジェクトルート（`kisekae/`ディレクトリ）に`.env`ファイルを作成します：

```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**重要**: 上記の値を、ステップ2で取得した実際の値に置き換えてください。

## 6. 動作確認

1. ターミナルで依存関係をインストール：
```bash
npm install
```

2. サーバーを起動：
```bash
npm start
```

3. ブラウザで `http://localhost:3000` にアクセス

4. カメラを起動して写真を撮影

5. Supabaseダッシュボードで確認：
   - **Table Editor** → **photos** テーブルにデータが追加されているか
   - **Storage** → **photos** バケットに画像がアップロードされているか

## トラブルシューティング

### エラー: "Invalid API key"

- `.env`ファイルの`SUPABASE_ANON_KEY`が正しいか確認
- APIキーにスペースや改行が含まれていないか確認

### エラー: "relation "photos" does not exist"

- SQL Editorでテーブル作成のSQLを実行したか確認
- Table Editorで`photos`テーブルが存在するか確認

### エラー: "The resource you are looking for does not exist"

- Storageで`photos`バケットが作成されているか確認
- バケットが公開設定（Public）になっているか確認

### 写真がStorageにアップロードされない

1. Storageのポリシーを確認：
   - Storage → photos → Policies
2. もしポリシーがない場合、以下のSQLを実行：

```sql
-- 誰でもアップロード可能にする（開発用）
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'photos');

-- 誰でも読み取り可能にする
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
```

## セキュリティ設定（オプション・本番環境推奨）

### Row Level Security (RLS)の有効化

開発段階では無効でOKですが、本番環境では有効化を推奨：

```sql
-- RLSを有効化
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Public Read Access"
ON photos FOR SELECT
TO public
USING (true);

-- 認証済みユーザーのみ挿入可能
CREATE POLICY "Authenticated Insert Access"
ON photos FOR INSERT
TO authenticated
WITH CHECK (true);
```

## 次のステップ

- ✅ 認証機能の追加（Supabase Auth）
- ✅ ユーザーごとの写真管理
- ✅ 画像の削除機能
- ✅ 画像の検索・フィルター機能
- ✅ リアルタイム同期機能

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript クライアント](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Storage](https://supabase.com/docs/guides/storage)



