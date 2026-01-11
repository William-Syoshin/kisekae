-- セッションテーブルを作成
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  clothing_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存のphotosテーブルを削除（バックアップしてから実行推奨）
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

-- コメントを追加
COMMENT ON TABLE sessions IS '撮影セッション情報';
COMMENT ON COLUMN sessions.nickname IS 'ユーザーのニックネーム';
COMMENT ON COLUMN sessions.clothing_prompt IS '服装のプロンプト';

COMMENT ON TABLE photos IS '撮影された写真';
COMMENT ON COLUMN photos.session_id IS 'セッションID（外部キー）';


