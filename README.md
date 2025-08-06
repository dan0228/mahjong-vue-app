# よんじゃん！ - 猫と一緒に楽しむ新感覚麻雀ゲーム

<p align="center">
  <img src="https://mahjong-vue-app.vercel.app/assets/info/cat_icon_2.png" alt="よんじゃん！ゲーム画面のスクリーンショット" width="600">
</p>

<p align="center">
  <strong>かわいい猫たちと、いつでもどこでも手軽に麻雀を楽しもう！</strong>
</p>

<p align="center">
  <a href="https://mahjong-vue-app.vercel.app/"><strong>👉 ゲームをプレイする</strong></a>
</p>

---

## 🎯 ゲームの概要

「よんじゃん！」は、**手牌 4 枚**から始める超スピーディーな四人麻雀ゲームです。Vue.js 3 を使用して構築されており、PWA (Progressive Web App) としても動作するため、スマートフォンにインストールしてネイティブアプリのように遊ぶことも可能です。

3 人の個性的な CPU 対戦相手と、東場のみの短期決戦で腕を競いましょう！

## ✨ 主な特徴

- **🀄 新感覚の四牌麻雀:** 手牌が 4 枚でテンパイ、5 枚で和了（あがり）となる特殊ルール。初心者でもすぐに楽しめます。
- **🐈 個性的なキャラクター:** かわいい猫たちが対戦相手として登場し、ゲームを盛り上げます。
- **⚡ スピーディーなゲーム展開:** 東場のみの短期決戦なので、短い時間でサクッと遊べます。
- **📱 PWA 対応:** スマートフォンのホーム画面に追加すれば、オフラインでも快適にプレイできます。
- **🎵 心地よい BGM:** ゲームの世界観に合わせた、懐かしさを感じるオリジナル BGM。

## 🛠️ 技術スタック

このプロジェクトは、以下のモダンな技術を使用して構築されています。

<p align="left">
  <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue.js">
  <img src="https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black" alt="Pinia">
  <img src="https://img.shields.io/badge/Vue_Router-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue Router">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
</p>

- **フレームワーク:** Vue.js 3 (Composition API)
- **状態管理:** Pinia
- **ルーティング:** Vue Router
- **ビルドツール:** Vite
- **デプロイ:** Vercel

## 📂 プロジェクト構造

主要なディレクトリとファイルの役割は以下の通りです。

```
mahjong-vue-app/
├── public/              # 画像、音声、manifest.jsonなどの静的アセット
├── src/
│   ├── components/      # 再利用可能なVueコンポーネント
│   ├── services/        # 麻雀のコアロジック
│   ├── stores/          # Piniaストア（グローバルな状態管理）
│   ├── views/           # 各画面（ページ）のコンポーネント
│   ├── router/          # ルーティング設定（SEO対策のメタタグ更新も含む）
│   ├── styles/          # グローバルなCSSスタイル
│   ├── utils/           # 汎用的なユーティリティ関数
│   ├── App.vue          # アプリケーションのルートコンポーネント
│   └── main.js          # アプリケーションのエントリーポイント
├── index.html           # SEO・OGPタグが設定されたメインのHTMLファイル
├── package.json         # プロジェクトの依存関係とスクリプト
└── vite.config.js       # Viteの設定ファイル
```

## 🚀 セットアップと実行方法

1.  **リポジトリをクローン:**

    ```bash
    git clone https://github.com/your-username/mahjong-vue-app.git
    cd mahjong-vue-app
    ```

2.  **依存関係のインストール:**

    ```bash
    npm install
    ```

3.  **開発サーバーの起動:**

    ```bash
    npm run dev
    ```

    ホットリロード対応の開発サーバーが起動します。ブラウザで `http://localhost:5173` などにアクセスしてください。

4.  **本番用のビルド:**
    ```bash
    npm run build
    ```
    `dist` ディレクトリに最適化された本番用ファイルが生成されます。

## 📈 SEO 対策について

このプロジェクトでは、SPA でありながら検索エンジンに正しく認識されるよう、以下の基本的な SEO 対策を実装しています。

- **メタタグの動的更新:** Vue Router のナビゲーションガードを利用し、ページごとに最適な `title` と `description` を動的に設定。
- **OGP タグの設定:** SNS でシェアされた際に、適切なタイトルや画像が表示されるよう `index.html` に OGP タグを記述。
- **`robots.txt` と `sitemap.xml`:** クローラーの巡回を助けるためのファイルを `public` ディレクトリに設置。

---

開発者: [dan]
