# Firebase セットアップ手順（初心者向け）

Study Board は **Firebase Firestore** で投稿をリアルタイム共有します。  
同じ **参加コード** を入力した人だけが、同じルームの投稿を見られます。

---

## 1. Firebase プロジェクトを作る

1. ブラウザで [Firebase Console](https://console.firebase.google.com/) を開く  
2. Google アカウントでログイン  
3. **「プロジェクトを追加」** をクリック  
4. プロジェクト名（例：`study-board-dev`）を入力して進める  
5. Google アナリティクスは **オフでもOK**（後から有効化できます）

---

## 2. Firestore データベースを有効化

1. 左メニュー **「構築」→「Firestore Database」**  
2. **「データベースの作成」**  
3. ロケーションは **asia-northeast1（東京）** など近いリージョンを選択  
4. セキュリティは一旦 **テストモード** で作成してもよいですが、**すぐに本番用ルールをデプロイ**してください（手順 5）

---

## 3. Web アプリを登録して設定値を取得

1. プロジェクトのトップ画面で **「</> Web」**（アプリを追加）  
2. アプリのニックネーム（例：`study-board-web`）を入力  
3. **「アプリを登録」**  
4. 表示される `firebaseConfig` の値をコピー  

---

## 4. 環境変数を設定する

`study-board` フォルダに `.env.local` を作成します（`.env.local.example` をコピーして編集）。

```bash
cd study-board
cp .env.local.example .env.local
```

`.env.local` の例：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef
```

**重要**

- `NEXT_PUBLIC_` で始まる変数はブラウザから参照されます（Firebase Web SDK の一般的な使い方です）
- `.env.local` は Git にコミットしないでください（`.gitignore` に含まれています）
- 変更後は **開発サーバーを再起動**（`Ctrl+C` → `npm run dev`）

---

## 5. セキュリティルールをデプロイする

このリポジトリには `firestore.rules` が含まれています。

### 方法A：Firebase コンソール（GUI）

1. Firestore → **「ルール」** タブ  
2. `study-board/firestore.rules` の内容を貼り付け  
3. **「公開」**

### 方法B：Firebase CLI

```bash
npm install -g firebase-tools
firebase login
cd study-board
firebase init firestore   # 既存の firebase.json / firestore.rules を使う
firebase deploy --only firestore:rules
```

---

## 6. 動作確認

1. 依存関係をインストール  

   ```bash
   cd study-board
   npm install
   npm run dev
   ```

2. ブラウザで `http://localhost:3000` を開く  
3. **参加コード** と **表示名** を入力して「共有ボードを開く」  
4. 別のブラウザ（またはシークレットウィンドウ）で **同じ参加コード** を入力  
5. 片方で投稿すると、もう片方に **リアルタイム** で表示されることを確認  

---

## データの保存場所（構造）

```
rooms/{roomId}/posts/{postId}
  ├ displayName   … 表示名（最大16文字）
  ├ text          … 投稿本文（最大2000文字）
  ├ clientId      … 端末ごとのID（自分の投稿判定用）
  └ createdAt     … 送信時刻（サーバー時刻）
```

- `roomId` は参加コードを **SHA-256 でハッシュ化** した値です  
- 参加コードそのものは Firestore のパスに直接保存しません  

---

## セキュリティルールの説明

`firestore.rules` の要点：

| 操作 | 内容 |
|------|------|
| **read** | `roomId` が 64 文字の16進数（SHA-256）のときだけ読み取り可 |
| **create** | 上記に加え、フィールド・文字数・`createdAt` がサーバー時刻であることを検証 |
| **update / delete** | 禁止（投稿の改ざん・削除を防ぐ） |

### 注意（本番運用前に必ず読む）

- このアプリは **Firebase Authentication を使っていません**  
- ルームIDは参加コードのハッシュなので、**コードを知っている人は読み書きできます**  
- ルールは「フィールド検証・スパム抑制」が主目的で、**完全なアクセス制御ではありません**  
- 社外秘の情報を扱う場合は、次のいずれかを検討してください：  
  - Firebase Authentication（メール/Google ログイン）  
  - 参加コードをサーバーで検証して Custom Token を発行  
  - 社内 VPN / IP 制限と組み合わせる  

### テストモードのままにしない理由

テストモードでは誰でも読み書きできる期間があり、**公開直後に悪用される**ことがあります。必ず `firestore.rules` を公開してください。

---

## よくあるエラー

| 症状 | 対処 |
|------|------|
| 「Firebase が未設定です」 | `.env.local` を作成し、6項目すべて設定してサーバー再起動 |
| `Missing or insufficient permissions` | ルール未デプロイ、または `createdAt` に `serverTimestamp()` を使っていない |
| 投稿が表示されない | 参加コードが完全一致しているか（大文字小文字は区別されません） |
| インデックスエラー | 初回はコンソールのリンクからインデックス作成（`createdAt` の単一フィールドは通常不要） |

---

## 次の改善案

- Firebase Authentication でログイン必須にする  
- 参加コードを Cloud Functions で検証  
- 投稿の削除・編集（本人のみ）  
- 画像添付（Firebase Storage）
