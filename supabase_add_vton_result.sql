-- photosテーブルにvton_result_urlカラムを追加
-- VTON（着せ替え）結果画像のURLを保存するため

ALTER TABLE photos
ADD COLUMN IF NOT EXISTS vton_result_url TEXT;

-- コメント追加
COMMENT ON COLUMN photos.vton_result_url IS 'Virtual Try-on結果画像のURL（Supabase StorageまたはReplicate URL）';


