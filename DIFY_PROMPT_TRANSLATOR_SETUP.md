# 🌐 Dify プロンプト翻訳ワークフロー設定ガイド

日本語の服装説明を、AI 画像生成に最適な英語プロンプトに翻訳・最適化するワークフローです。

---

## 🎯 目標

日本語入力（例：「赤いワンピース」）→ 最適化された英語プロンプト（例：「An elegant red dress, full body shot, professional fashion photography...」）

---

## 📋 必要な準備

### 1. Dify にログイン

```
https://cloud.dify.ai/
```

または自己ホスト版を使用

### 2. LLM プロバイダーを設定

#### 推奨モデル

| プロバイダー  | モデル            | 日本語 → 英語 | コスト | 推奨度  |
| ------------- | ----------------- | ------------- | ------ | ------- |
| **OpenAI**    | GPT-4o-mini       | ⭐⭐⭐⭐⭐    | 低     | ✅ 推奨 |
| **Anthropic** | Claude 3 Haiku    | ⭐⭐⭐⭐⭐    | 低     | ✅ 推奨 |
| **OpenAI**    | GPT-4o            | ⭐⭐⭐⭐⭐    | 高     | 高品質  |
| **Anthropic** | Claude 3.5 Sonnet | ⭐⭐⭐⭐⭐    | 中     | 高品質  |

**推奨: GPT-4o-mini**（コスパ最高）

---

## 🔧 Dify ワークフロー作成手順

### ステップ 1: 新しいワークフローを作成

1. Dify ダッシュボードで「**スタジオ**」→「**ワークフローを作成**」をクリック
2. 名前: `Fashion Prompt Translator`（日本語名：服装プロンプト翻訳）
3. タイプ: **ワークフロー** を選択
4. アイコン: 🌐 を選択（任意）

---

### ステップ 2: ワークフローの構築

#### 📥 **ブロック 1: 開始（Start）**

1. 左側のパネルから「**開始**」ブロックを選択（デフォルトで配置済み）
2. 入力変数を設定：

| 設定項目         | 値                     |
| ---------------- | ---------------------- |
| **変数名**       | `japanese_description` |
| **フィールド名** | `日本語説明`           |
| **タイプ**       | テキスト               |
| **必須**         | ✅ オン                |
| **最大長**       | 200                    |

**入力変数の説明欄**:

```
服装の日本語説明を入力してください（例: 赤いワンピース、白いシャツとジーンズ）
```

---

#### 🤖 **ブロック 2: LLM**

1. 左パネルから「**LLM**」ブロックをドラッグ＆ドロップ
2. 開始ブロックと接続

**LLM ブロックの設定**:

##### モデル選択

- **プロバイダー**: OpenAI
- **モデル**: gpt-4o-mini
- **温度**: 0.7
- **最大トークン**: 300
- **Top P**: 0.9

##### システムプロンプト

```
You are a professional AI prompt engineer specializing in fashion photography and image generation.

Your task:
1. Translate the Japanese fashion description to English
2. Enhance it for AI image generation (Flux Schnell model)
3. Add professional photography terminology
4. Make it vivid, descriptive, and optimized for high-quality output

Guidelines:
- Keep it concise (50-100 words)
- Include: clothing details, photography style, lighting, background, quality keywords
- Use positive descriptive words
- Avoid negative prompts
- Focus on visual elements

Output format: A single paragraph of enhanced English prompt, ready for AI image generation.

Examples:
Input: "赤いワンピース"
Output: "An elegant red dress, full body shot, professional fashion photography, soft studio lighting, white background, high quality, 8k resolution, detailed fabric texture, graceful pose"

Input: "カジュアルな白いシャツとジーンズ"
Output: "Casual white shirt and blue jeans, relaxed fit, modern street style photography, natural lighting, urban background, high quality, detailed clothing texture, comfortable and stylish"
```

##### ユーザープロンプト

```
{{#start.japanese_description#}}
```

##### レスポンス

「**text**」を選択（デフォルト）

---

#### 📤 **ブロック 3: 終了（End）**

1. 左パネルから「**終了**」ブロックをドラッグ＆ドロップ
2. LLM ブロックと接続

**終了ブロックの設定**:

出力変数を追加：

| 設定項目   | 値               |
| ---------- | ---------------- |
| **変数名** | `english_prompt` |
| **タイプ** | テキスト         |
| **ソース** | `{{#llm.text#}}` |

**説明欄**:

```
最適化された英語プロンプト
```

---

### ステップ 3: ワークフローを保存＆公開

1. 右上の「**保存**」ボタンをクリック
2. 「**公開**」ボタンをクリック
3. 公開確認ダイアログで「**公開**」をクリック

---

### ステップ 4: API キーを取得

1. 公開後、「**API 管理**」タブをクリック
2. 「**API キー**」セクションで「**作成**」をクリック
3. 名前: `Kisekae App`
4. 「**作成**」をクリック
5. **API キーをコピー**（後で使用）

**重要**: API キーは一度しか表示されないので、必ずコピーして保存してください！

---

### ステップ 5: API エンドポイントを確認

「**API 管理**」タブで以下を確認：

```
API エンドポイント: https://api.dify.ai/v1
ワークフロー実行URL: https://api.dify.ai/v1/workflows/run
```

---

## 🧪 テスト

### Dify 内でテスト

1. 「**デバッグとプレビュー**」タブをクリック
2. 「日本語説明」フィールドに入力:
   ```
   赤いワンピース
   ```
3. 「**実行**」をクリック
4. 出力を確認:
   ```
   An elegant red dress, full body shot, professional fashion photography, soft studio lighting, white background, high quality, 8k resolution, detailed fabric texture, graceful pose
   ```

### cURL でテスト

```bash
curl -X POST 'https://api.dify.ai/v1/workflows/run' \
  -H 'Authorization: Bearer YOUR-API-KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputs": {
      "japanese_description": "赤いワンピース"
    },
    "response_mode": "blocking",
    "user": "user-001"
  }'
```

---

## 📝 .env.local 設定

プロジェクトの`.env.local`ファイルに以下を追加：

```bash
# Dify設定（プロンプト翻訳用）
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_ENDPOINT=https://api.dify.ai/v1
```

**自己ホスト版を使用する場合**:

```bash
DIFY_API_ENDPOINT=http://localhost/v1
```

---

## 🎨 翻訳の例

| 日本語入力                            | 英語出力（最適化）                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 赤いワンピース                        | An elegant red dress, full body shot, professional fashion photography, soft studio lighting, white background, high quality, 8k resolution, detailed fabric texture, graceful pose   |
| 白いシャツとジーンズ                  | Casual white shirt and blue jeans, relaxed fit, modern street style photography, natural lighting, urban background, high quality, detailed clothing texture, comfortable and stylish |
| 黒いスーツ                            | Professional black business suit, formal attire, corporate fashion photography, studio lighting, clean background, high quality, detailed fabric, confident pose                      |
| カジュアルな T シャツとショートパンツ | Casual t-shirt and shorts, summer fashion, relaxed lifestyle photography, natural outdoor lighting, beach or park background, high quality, comfortable style                         |

---

## 💰 コスト見積もり

### GPT-4o-mini を使用した場合

- **入力**: ~20 トークン（日本語 5-10 文字）
- **出力**: ~100 トークン（英語プロンプト）
- **合計**: ~120 トークン/リクエスト

**料金**:

- 入力: $0.15 / 1M tokens = $0.000003 / request
- 出力: $0.60 / 1M tokens = $0.00006 / request
- **合計: 約 0.02 円 / リクエスト**

**月間 1,000 リクエスト**: 約 20 円

---

## 🔧 トラブルシューティング

### エラー: "Unauthorized"

**原因**: API キーが正しくない

**解決**:

1. Dify でワークフローが「公開」されているか確認
2. API キーを再生成
3. `.env.local`の API キーを更新

### エラー: "Workflow not found"

**原因**: ワークフローが公開されていない

**解決**:

1. Dify でワークフローを開く
2. 「公開」ボタンをクリック

### 翻訳品質が低い

**原因**: システムプロンプトが最適化されていない

**解決**:

1. Dify のシステムプロンプトを調整
2. 温度パラメータを変更（0.5-0.9）
3. より多くの例を追加

---

## 🚀 次のステップ

1. ✅ Dify ワークフローを作成・公開
2. ✅ API キーを取得
3. ✅ `.env.local`に設定を追加
4. ⏭️ Next.js アプリと統合（自動で実装されます）

---

## 📚 参考リンク

- [Dify 公式ドキュメント](https://docs.dify.ai/)
- [Dify API Reference](https://docs.dify.ai/api-reference)
- [Flux Schnell Documentation](https://replicate.com/black-forest-labs/flux-schnell)

---

**作成日**: 2026-01-11  
**バージョン**: 1.0
