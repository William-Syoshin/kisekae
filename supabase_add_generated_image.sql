-- sessionsテーブルに生成画像URL列を追加
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS generated_image_url TEXT;

-- コメントを追加
COMMENT ON COLUMN sessions.generated_image_url IS 'Difyで生成された服装画像のURL';

-- 確認
SELECT 'generated_image_url列を追加しました' as status;


