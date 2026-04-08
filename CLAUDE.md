# Prompt Diff

> 同じプロンプトを Claude / GPT / Gemini に同時に投げて、3カラムで横並び比較する Web アプリ。

---

## このプロジェクトのゴール

これは個人開発者のポートフォリオ作品です。**シニアエンジニアのコードレビューに耐えるコード品質**を最優先してください。動くことより、型安全性・エラーハンドリング・テスト・ドキュメントの4点で評価されます。

採用面接および技術記事(Zenn)でこのリポジトリを公開する前提で、すべての判断を行ってください。

---

## あなた(Claude Code)への運用ルール

1. **自走優先**: 不明点があっても、合理的な判断ができる場合は決定して進めてください。判断根拠は ADR に残してください。
2. **質問は最小限**: 重大な設計判断(例: 技術スタックの変更、スコープ追加)が必要な場合のみ確認を求めてください。
3. **PR ベースで進める**: 後述の PR 分割計画に従って 1 PR ずつ進めてください。PR ごとに進捗を要約し、次に着手する PR を宣言してから進んでください。
4. **動作確認**: 各 PR の最後に必ず `pnpm build` と `pnpm test` を通してください。通らない PR はマージしません。
5. **報告**: 全 PR 完了後、最終報告として「完成判定チェックリスト」を埋めて提出してください。

---

## 一行で

同じプロンプトを Claude / GPT / Gemini に同時に投げ、出力・応答時間・トークン数・推定コストを 3 カラムで横並び比較する Web アプリ。

## なぜ作るか(Why)

- モデル比較記事を書くたびに 3 つの UI を行き来するのが無駄
- プロンプト改善の A/B テストを同一画面で完結させたい
- 比較結果をそのまま技術記事に貼れる形で出力したい

## ターゲットユーザー

- AI を業務で使い倒している個人開発者
- モデル比較の技術記事を書くエンジニア
- プロンプトエンジニアリング実践者

---

## アーキテクチャ原則

- **Provider 抽象化**: 各 LLM プロバイダは共通インターフェース `LLMProvider` を実装する。新モデル追加は 1 ファイル追加のみで完結すること。
- **Server Component first**: クライアント化は必要最小限。`'use client'` は理由をコメントで明記する。
- **ストリーミングは Vercel AI SDK の `streamText` を使う**: 自前で SSE を実装しない。
- **Server Actions と Route Handler の使い分け**: ストリーミングは Route Handler、それ以外の変更系は Server Actions。
- **エラーは型で表現**: `Result<T, E>` 型を `lib/result.ts` に定義し、try-catch は最上位レイヤー(Route Handler / Server Action)に集約する。
- **環境変数は zod で検証**: `lib/env.ts` で起動時に検証し、型安全に参照する。
- **DB アクセスはクエリ層に集約**: コンポーネントから直接 Supabase クライアントを叩かない。

## やり過ぎ禁止(過剰設計の防止)

- 抽象化は **2 回目の重複が出てから** 導入する。1 回目は具体実装で OK。
- ライブラリは必要最小限。標準機能で済むなら標準を使う。
- DI コンテナ・リポジトリパターン・クリーンアーキテクチャの全層分離などは導入しない。
- コメントは「なぜ」を書く。「何をしているか」はコードで読める。
- ADR は重要な判断 4 つだけ(後述)。それ以上書かない。

---

## コード品質ルール

- TypeScript strict mode 必須。`any` は原則禁止(やむを得ない場合は `// eslint-disable-next-line @typescript-eslint/no-explicit-any` とコメント必須)。
- ESLint + Prettier + Husky の pre-commit hook を導入する。
- 関数は単一責任。20 行を超えたら分割を検討する。
- マジックナンバー禁止。定数は `lib/constants.ts` に集約する。
- 外部 API レスポンスは zod スキーマで検証してから使う。
- ローディング状態とエラー状態は必ず UI に反映する。
- ファイル名は kebab-case、コンポーネントは PascalCase で export する。

---

## テスト方針

- Vitest を使う。
- `lib/` 配下の純粋関数はカバレッジ 80% 以上。
- 各 Provider 実装には最低 1 つのユニットテスト(API レスポンスをモック)。
- E2E は MVP では不要。手動テスト手順を README に記載する。

---

## 技術スタック

| 領域           | 技術                            | 採用理由                                 |
| -------------- | ------------------------------- | ---------------------------------------- |
| Framework      | Next.js 15 (App Router)         | Server Component とストリーミングの両立  |
| 言語           | TypeScript (strict)             | 型安全性                                 |
| Styling        | Tailwind CSS + shadcn/ui        | 速度と品質の両立、カスタマイズ性         |
| DB             | Supabase (Postgres)             | 履歴保存のみで十分、将来の認証追加が容易 |
| LLM SDK        | Vercel AI SDK (`ai` パッケージ) | プロバイダ抽象とストリーミングの標準化   |
| バリデーション | zod                             | 環境変数・API レスポンス検証             |
| テスト         | Vitest                          | 高速、Next.js との相性良好               |
| Lint/Format    | ESLint + Prettier + Husky       | 一貫性                                   |
| Deploy         | Vercel                          | Next.js 公式、ゼロ設定                   |
| パッケージ管理 | pnpm                            | 速度とディスク効率                       |

---

## 機能スコープ(MVP)

### 含む

1. **3 カラム並列実行**
   - 上部に共通プロンプト入力欄
   - 「Run」ボタンで 3 モデルに同時 API 送信
   - 各カラムで Vercel AI SDK によるストリーミング表示
   - 初期モデル: `claude-sonnet-4-6` / `gpt-5` / `gemini-2.5-pro`

2. **モデル選択**
   - 各カラムでドロップダウンからモデルを切り替え可能
   - 同一プロバイダ内の別モデル比較も可

3. **メタ情報表示**
   - 各カラム下部: 応答時間 (ms) / 入力トークン / 出力トークン / 推定コスト (USD)
   - コスト計算は `lib/pricing.ts` に料金表をハードコード

4. **履歴保存**
   - Supabase にプロンプトと結果を保存
   - 共有 URL: `/compare/[id]`(認証不要、URL を知っていれば誰でも閲覧可)

5. **Markdown エクスポート**
   - 「Copy as Markdown」ボタンで Zenn 記事用フォーマットを生成

### 含まない(v2 以降)

- ユーザー認証(MVP は API キーを環境変数で持つ自分専用構成)
- 課金
- プロンプトテンプレート機能
- LLM-as-a-Judge による自動評価
- E2E テスト

---

## ディレクトリ構成

```
/app
  /(marketing)/page.tsx          # ランディングページ
  /compare/page.tsx              # メイン画面
  /compare/[id]/page.tsx         # 共有ビュー
  /api/run/route.ts              # ストリーミングエンドポイント
  /layout.tsx
  /globals.css
/lib
  /providers/
    types.ts                     # LLMProvider インターフェース
    anthropic.ts
    openai.ts
    google.ts
    index.ts                     # ファクトリ
  /db/
    client.ts                    # Supabase クライアント
    schema.ts                    # 型定義
    queries.ts                   # クエリ層
  /env.ts                        # zod による env 検証
  /result.ts                     # Result<T, E> 型
  /pricing.ts                    # モデル別料金表
  /constants.ts
  /utils.ts
/components
  /ui/                           # shadcn/ui 由来
  /compare/
    prompt-input.tsx
    result-column.tsx
    meta-info.tsx
    model-selector.tsx
    copy-as-markdown-button.tsx
/tests
  setup.ts
  providers/
    anthropic.test.ts
    openai.test.ts
    google.test.ts
  pricing.test.ts
/docs
  /adr/
    0001-nextjs-app-router.md
    0002-vercel-ai-sdk.md
    0003-provider-abstraction.md
    0004-no-auth-in-mvp.md
/supabase
  /migrations/
    0001_initial.sql
.env.example
.eslintrc.json
.prettierrc
.gitignore
.husky/pre-commit
vitest.config.ts
next.config.ts
tsconfig.json
package.json
ARCHITECTURE.md
README.md
CLAUDE.md
```

---

## データモデル

```sql
-- supabase/migrations/0001_initial.sql
create table comparisons (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  created_at timestamptz not null default now()
);

create table results (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  provider text not null,        -- 'anthropic' | 'openai' | 'google'
  model text not null,
  output text not null,
  latency_ms integer not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

create index results_comparison_id_idx on results(comparison_id);
```

---

## Git 運用

- ブランチ戦略: `main` + feature ブランチ。`main` への直 push 禁止。
- コミット規約: Conventional Commits (`feat:` `fix:` `refactor:` `docs:` `test:` `chore:`)
- 1 コミット 1 目的。巨大コミット禁止。
- PR はテンプレート(後述)を必ず使う。

### PR テンプレート (`.github/pull_request_template.md`)

```markdown
## What

(変更内容を 1-3 行)

## Why

(なぜ必要か)

## How

(設計上の判断、トレードオフ)

## Test

- [ ] `pnpm build` 通過
- [ ] `pnpm test` 通過
- [ ] 手動確認済み
```

---

## PR 分割計画(この順番で進める)

各 PR は独立してマージ可能で、main は常にデプロイ可能な状態を保つこと。

### PR #1: プロジェクト初期化

- Next.js 15 + TypeScript strict + pnpm セットアップ
- Tailwind + shadcn/ui 導入
- ESLint + Prettier + Husky 設定
- `.env.example` 作成
- README に Getting Started を記載
- Vercel デプロイ確認(空ページで OK)

### PR #2: env 検証と Result 型

- `lib/env.ts`(zod による環境変数検証)
- `lib/result.ts`(`Result<T, E>` 型と `ok()` / `err()` ヘルパー)
- ユニットテスト

### PR #3: Provider 抽象化と 3 プロバイダ実装

- `lib/providers/types.ts`(`LLMProvider` インターフェース)
- `anthropic.ts` / `openai.ts` / `google.ts`(Vercel AI SDK 経由)
- `lib/pricing.ts`(モデル別料金表)
- 各プロバイダのユニットテスト(SDK モック)

### PR #4: Supabase スキーマとクエリ層

- `supabase/migrations/0001_initial.sql`
- `lib/db/client.ts` / `schema.ts` / `queries.ts`
- ローカル動作確認手順を README に追記

### PR #5: メイン画面の UI(モック動作)

- `/compare/page.tsx`
- `prompt-input.tsx` / `result-column.tsx` / `meta-info.tsx` / `model-selector.tsx`
- まずはモックデータで 3 カラムレイアウトを完成
- レスポンシブ対応(モバイルは縦並び)

### PR #6: ストリーミング API と統合

- `/api/run/route.ts`(3 プロバイダ並列実行 + ストリーミング)
- フロントとの結線
- ローディング/エラー UI
- メタ情報の実データ反映

### PR #7: 履歴保存と共有 URL

- 実行完了時に Supabase に保存
- `/compare/[id]/page.tsx`(共有ビュー、Server Component)

### PR #8: Markdown エクスポート

- `copy-as-markdown-button.tsx`
- フォーマット定義は `lib/utils.ts` の純粋関数に切り出してテスト

### PR #9: ランディングページと README 完成版

- `/(marketing)/page.tsx`(What & Why、デモ GIF プレースホルダ)
- README を「README 必須構成」に従って完成
- ARCHITECTURE.md 作成
- ADR 4 本を書き上げる

### PR #10: 仕上げ

- アクセシビリティチェック(キーボード操作、aria-label)
- メタタグ・OGP 設定
- エラーバウンダリ
- 404 / 500 ページ
- 最終的な型・lint・テスト確認

---

## ADR(必ず書く 4 本)

`/docs/adr/` 配下に以下を Context / Decision / Consequences の 3 セクションで記述する。

1. **0001-nextjs-app-router.md**: なぜ Pages Router でなく App Router か
2. **0002-vercel-ai-sdk.md**: なぜ各 SDK 直叩きでなく Vercel AI SDK か
3. **0003-provider-abstraction.md**: Provider 抽象化の設計と将来の拡張方針
4. **0004-no-auth-in-mvp.md**: なぜ MVP で認証を入れないか、将来の追加方針

---

## README 必須構成(英語で書く)

1. タイトル + バッジ(Vercel デプロイ、ライセンス、Next.js バージョン)
2. デモ GIF(プレースホルダで OK、後で差し替え)
3. What & Why
4. Features(スクショ付き、プレースホルダ可)
5. Tech Stack(各技術の採用理由を 1 行ずつ)
6. Architecture(ディレクトリツリー + 主要な設計判断)
7. Getting Started(コピペで動く手順)
8. Environment Variables(`.env.example` と対応)
9. Project Structure(主要ディレクトリの役割)
10. Design Decisions(ADR へのリンク)
11. Roadmap(v2 で追加する機能)
12. License (MIT)

---

## 環境変数

`.env.example` に以下を記載:

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`lib/env.ts` で zod により起動時検証。欠けていればビルド時にエラー。

---

## 完成判定チェックリスト(最終報告で埋める)

- [ ] PR #1 ~ #10 すべてマージ済み
- [ ] `pnpm build` がエラー・警告ゼロで通る
- [ ] `pnpm test` がすべて通り、`lib/` カバレッジ 80% 以上
- [ ] `pnpm lint` がエラーゼロ
- [ ] TypeScript エラーゼロ、`any` 不使用(または例外箇所を一覧化)
- [ ] Vercel にデプロイ済み、本番 URL で 3 モデル実行が動作
- [ ] README が必須構成 12 項目すべて埋まっている
- [ ] ADR 4 本が書かれている
- [ ] 履歴保存と共有 URL が動作
- [ ] Markdown エクスポートが動作
- [ ] モバイル表示確認済み
- [ ] エラーバウンダリと 404/500 ページ実装済み

---

## 最終報告フォーマット

完成時に以下を提出してください:

```
## 完成報告

### 完成判定チェックリスト
(上記を埋めた状態で貼る)

### 本番 URL
https://...

### リポジトリ URL
https://github.com/...

### 各 PR の概要
PR #1: ...
PR #2: ...
...

### 設計上の重要判断(3-5 個)
1. ...
2. ...

### 既知の制約と将来の改善点
- ...

### 使用したトークン量と所要時間の概算
- ...
```

---

## 着手手順

1. このファイル全体を読む
2. PR #1 から順に、PR ごとに以下を繰り返す:
   a. ブランチを切る
   b. 実装する
   c. `pnpm build` と `pnpm test` を通す
   d. PR を作成しマージする
   e. 進捗を 1 行で報告し、次の PR を宣言してから着手する
3. PR #10 完了後、最終報告フォーマットに従って報告する

開始してください。
