# 📸 Dify 統合ワークフロー設定ガイド

1つのDifyワークフローで画像生成と画像分析の両方を実装します。

---

## 🎯 目標

1つのワークフローで以下の2つの機能を実現：

1. **画像生成**: 服装プロンプト → AI生成画像
2. **画像分析**: 撮影した写真 → AI説明文

---

## 📋 必要な準備

### 1. Dify プロジェクトにログイン

```
https://dify.ai/
```

### 2. 使用するプロバイダーを確認

#### 画像生成用

| プロバイダー | モデル | 用途 |
|------------|--------|------|
| **Stability AI** | Stable Diffusion XL | 画像生成 |

#### 画像分析用

| プロバイダー | モデル | Vision対応 | 日本語対応 |
|------------|--------|-----------|-----------|
| **OpenAI** | GPT-4o-mini | ✅ | ✅ |
| **Anthropic** | Claude 3 Haiku | ✅ | ✅ |

---

## 🔧 Dify ワークフロー作成手順

### ステップ1: 既存のワークフローを修正

既存の「画像生成」ワークフローを開きます。

現在の構成:
```
[Start: clothing_prompt] → [LLM翻訳] → [Stability AI] → [End: image_url]
```

これを以下に変更します:
```
[Start: clothing_prompt + image_url]
         ↓
    [条件分岐]
    ↓              ↓
[画像生成]      [画像分析]
[LLM翻訳]      [LLM Vision]
    ↓              ↓
[Stability AI] [説明文生成]
    ↓              ↓
    [End: 統合出力]
```

---

### ステップ2: Startブロック設定

#### 1. Startブロックを開く

#### 2. 入力変数を2つに変更

**既存の変数を維持:**

| 設定項目 | 値 |
|---------|---|
| **変数名** | `clothing_prompt` |
| **タイプ** | `String` |
| **必須** | ❌ いいえ（チェックを外す） |
| **説明** | 服装の説明（画像生成時に使用） |

**新しい変数を追加:**

| 設定項目 | 値 |
|---------|---|
| **変数名** | `image_url` |
| **タイプ** | `String` |
| **必須** | ❌ いいえ（チェックを外す） |
| **説明** | 分析する画像（Base64またはURL） |

**重要:** 両方とも必須のチェックを**外す**（任意にする）

---

### ステップ3: 条件分岐ブロックを追加

#### 1. 「IF/ELSE」ブロックを追加

左サイドバーから「**IF/ELSE**」ブロックをドラッグ

#### 2. Startブロックと接続

```
[Start] → [IF/ELSE]
```

#### 3. 条件を設定

**IF条件（画像生成）:**

```
変数: {{#start.clothing_prompt#}}
条件: is not empty（空でない）
```

または

```
変数: {{#start.image_url#}}
条件: is empty（空である）
```

**説明:**
- `clothing_prompt` が存在する → 画像生成ルート
- `image_url` が存在する → 画像分析ルート（ELSEブランチ）

---

### ステップ4: 画像生成ルート（IFブランチ）

**既存のブロックをそのまま使用:**

```
[IF: clothing_prompt exists]
    ↓
[LLM翻訳] (既存)
    ↓
[Stability AI] (既存)
    ↓
[画像URL出力]
```

#### IFブランチに接続

1. IF/ELSEブロックの「**IF**」出力を既存のLLM翻訳ブロックに接続
2. 既存の流れはそのまま維持

---

### ステップ5: 画像分析ルート（ELSEブランチ）

#### 1. 新しいLLMブロックを追加

左サイドバーから「**LLM**」ブロックをドラッグ

#### 2. ELSEブランチに接続

```
[ELSE: image_url exists]
    ↓
[LLM Vision] (新規)
```

#### 3. LLM設定

| 設定項目 | 値 |
|---------|---|
| **プロバイダー** | OpenAI |
| **モデル** | `gpt-4o-mini` |
| **Temperature** | 0.7 |
| **Max Tokens** | 500 |
| **Vision機能** | ✅ 有効化 |

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

画像: {{#start.image_url#}}
```

#### 5. Vision設定

- **画像入力**: `{{#start.image_url#}}`
- フォーマット: Base64 / URL（両方対応）

---

### ステップ6: Endブロックを統合

#### 方法1: 複数の出力変数を設定（推奨）

**Endブロックの設定:**

| 変数名 | タイプ | ソース |
|-------|-------|-------|
| `image_url` | String | `{{#stability_ai.output#}}` |
| `description` | String | `{{#llm_vision.text#}}` |

**接続:**

```
[Stability AI] → [End]
[LLM Vision]   → [End]
```

両方のルートから同じEndブロックに接続します。

**注意:** 
- 画像生成時は `image_url` のみ返され、`description` は空
- 画像分析時は `description` のみ返され、`image_url` は空

---

#### 方法2: 2つのEndブロックを使用

**End1（画像生成用）:**

| 変数名 | ソース |
|-------|-------|
| `image_url` | `{{#stability_ai.output#}}` |

**End2（画像分析用）:**

| 変数名 | ソース |
|-------|-------|
| `description` | `{{#llm_vision.text#}}` |

**接続:**

```
[Stability AI] → [End1]
[LLM Vision]   → [End2]
```

---

### ステップ7: ワークフロー全体図

```
                [Start]
                  ↓
      clothing_prompt / image_url
                  ↓
              [IF/ELSE]
         ↓              ↓
    [IFブランチ]     [ELSEブランチ]
         ↓              ↓
  clothing_prompt   image_url
    exists?         exists?
         ↓              ↓
    [LLM翻訳]       [LLM Vision]
         ↓          (GPT-4o-mini)
  英語プロンプト        ↓
         ↓          画像分析
   [Stability AI]       ↓
         ↓          日本語説明文
    生成画像URL         ↓
         ↓              ↓
         └─────[End]────┘
         
    出力: image_url / description
```

---

### ステップ8: ワークフローをテスト

#### テスト1: 画像生成

**入力:**

```json
{
  "clothing_prompt": "赤いワンピース、エレガント",
  "image_url": ""
}
```

**期待される出力:**

```json
{
  "image_url": "https://api.stability.ai/v1/...",
  "description": null
}
```

---

#### テスト2: 画像分析

**入力:**

```json
{
  "clothing_prompt": "",
  "image_url": "data:image/png;base64,iVBORw0KGgo..."
}
```

**期待される出力:**

```json
{
  "image_url": null,
  "description": "この画像には、明るい色のワンピースを着た人物が写っています..."
}
```

---

### ステップ9: ワークフローを公開

#### 1. 保存

「**保存**」ボタンをクリック

#### 2. APIとして公開

1. 右上の「**公開**」ボタンをクリック
2. 「**APIとして公開**」を選択
3. 確認して公開

#### 3. API情報を取得

```
API Key: app-xxxxxxxxxxxxxxxxxxxxxx
API Endpoint: https://api.dify.ai/v1/workflows/run
```

**重要:** この1つのエンドポイントで画像生成と画像分析の両方を処理します！

---

## 🔐 環境変数の設定

### `.env.local` ファイルを更新

既存の `.env.local` ファイルを開いて、以下のように**シンプル**にします：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Dify統合API設定（画像生成と画像分析の両方）
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

**削除する変数（もう不要）:**

```bash
# これらは削除してOK
DIFY_ANALYZE_API_KEY=...
DIFY_ANALYZE_API_ENDPOINT=...
```

**環境変数が2つだけ**になりました！✨

---

## 🚀 アプリケーションの起動

### 1. サーバーを再起動

```bash
cd /Users/yuchenzhou/Desktop/kisekae
npm run dev
```

### 2. ブラウザでテスト

```
http://localhost:3000
```

---

## 🎯 完全な動作フロー

### 使用フロー

```
1. 「撮影をスタート」
   ↓
   
2. フォーム入力
   - ニックネーム: テスト
   - 服装プロンプト: 赤いワンピース、エレガント
   ↓ 「撮影開始」
   
3. バックエンド処理
   ✓ Dify APIを呼び出し（clothing_prompt送信）
   ✓ IFブランチ → 画像生成ルート
   ✓ 15-30秒で画像生成
   ✓ カメラ起動
   
4. 撮影
   ↓ 「撮影する」
   
5. 写真撮影
   ✓ Supabaseに保存
   ✓ Dify APIを呼び出し（image_url送信）
   ✓ ELSEブランチ → 画像分析ルート
   ✓ 10-20秒で分析完了
   
6. 結果表示
   ✓ 生成画像表示
   ✓ 分析結果表示
```

---

## 🐛 トラブルシューティング

### エラー: 「Dify API設定が不完全です」

**原因:** `.env.local` が正しく設定されていない

**解決:**

```bash
# 環境変数を確認
# DIFY_API_KEY=app-xxxx
# DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/run

# サーバー再起動
npm run dev
```

---

### エラー: 「画像URLが取得できませんでした」

**原因1:** IFブランチの条件が正しくない

**解決:** Difyワークフローの条件分岐を確認

**原因2:** Stability AIの出力変数名が違う

**解決:** Endブロックで正しい変数を参照

---

### エラー: 「画像の説明が取得できませんでした」

**原因1:** LLM VisionでVision機能が無効

**解決:** 
1. Difyワークフローを開く
2. LLM Visionブロックを選択
3. Vision機能を有効化

**原因2:** image_urlが正しく渡されていない

**解決:** 
1. ELSEブランチの接続を確認
2. LLM VisionのUser Promptで `{{#start.image_url#}}` を確認

---

### 両方の機能が動かない

**チェックリスト:**

1. ✅ `.env.local` に `DIFY_API_KEY` と `DIFY_API_ENDPOINT` が設定されているか
2. ✅ サーバーを再起動したか
3. ✅ Difyワークフローが公開されているか
4. ✅ 条件分岐ブロックが正しく設定されているか
5. ✅ 両方のブロックがEndに接続されているか

---

## 📊 APIプロバイダー設定

### Stability AI（画像生成用）

#### APIキー取得

```
https://platform.stability.ai/
→ Account → API Keys → Create API Key
```

#### Difyに設定

```
Dify → 設定 → モデルプロバイダー → Stability AI
→ APIキーを入力 → 保存
```

---

### OpenAI（画像分析用）

#### APIキー取得

```
https://platform.openai.com/
→ API keys → Create new secret key
```

#### Difyに設定

```
Dify → 設定 → モデルプロバイダー → OpenAI
→ APIキーを入力 → 保存
```

---

## 🎉 メリットの確認

### ✅ 実現できたこと

1. **環境変数が2つだけ**
   - `DIFY_API_KEY`
   - `DIFY_API_ENDPOINT`

2. **1つのワークフローで管理**
   - メンテナンスが楽
   - API管理がシンプル

3. **柔軟な拡張性**
   - 将来的に新機能を追加しやすい
   - 条件分岐を増やせば、さらに多機能化可能

4. **コスト管理が簡単**
   - 1つのワークフローで全体の使用量を確認

---

## 📝 条件分岐の設定例

### IF/ELSEブロックの詳細設定

**方法1: clothing_promptをチェック**

```
IF:
  変数: {{#start.clothing_prompt#}}
  条件: is not empty
  
  → 画像生成ルートへ
  
ELSE:
  → 画像分析ルートへ
```

**方法2: image_urlをチェック**

```
IF:
  変数: {{#start.image_url#}}
  条件: is empty
  
  → 画像生成ルートへ
  
ELSE:
  → 画像分析ルートへ
```

**推奨:** 方法1（clothing_promptをチェック）の方が明確

---

## 🎨 ワークフローのビジュアル

### 最終的な構成図

```
┌─────────────────────────────────────────┐
│              Start                      │
│                                         │
│  入力1: clothing_prompt (Optional)      │
│  入力2: image_url (Optional)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│           IF/ELSE                       │
│                                         │
│  IF: clothing_prompt が存在する?        │
└──────┬──────────────────────┬───────────┘
       │                      │
    Yes│                   No │
       │                      │
       ▼                      ▼
┌─────────────┐        ┌──────────────┐
│ 画像生成     │        │ 画像分析      │
├─────────────┤        ├──────────────┤
│ LLM翻訳     │        │ LLM Vision   │
│     ↓       │        │ (GPT-4o-mini)│
│ Stability AI│        │     ↓        │
│     ↓       │        │  説明文生成   │
│  画像URL    │        │     ↓        │
│             │        │  description │
└──────┬──────┘        └──────┬───────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
         ┌──────────────┐
         │     End      │
         │              │
         │ image_url    │
         │ description  │
         └──────────────┘
```

---

## 🆘 サポート

問題が解決しない場合は、以下の情報を共有してください：

1. Difyワークフローのスクリーンショット
2. ブラウザのコンソールエラー（F12で確認）
3. サーバーのターミナルログ
4. どちらの機能でエラーが出たか（画像生成 or 画像分析）

---

## 🎊 完成！

**これで1つの統合ワークフローで、画像生成と画像分析の両方が動作します！**

環境変数もシンプルになり、管理が楽になりました！✨

まずはDifyワークフローの修正から始めましょう！🚀


