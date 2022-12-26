# apollo-boilerplate

## 準備

### 環境変数

`.env.example`をコピーし、`.env`にリネーム。

`.env`内のDBを設定しておく。

### npm

`npm install`で依存関係をインストール。

### prisma

`prisma migrate dev --name init`でDBマイグレーションを実行する。

`prisma db seed`でDBのシードを実行する。

`prisma studio`でデータベース内のデータを表示することが可能。

## 開発環境の立ち上げ

準備を完了しておく必要あり。

`npm run dev`で開発環境が立ち上がる。

## 製品版の立ち上げ

```
// コンテナイメージのビルド
$ docker build -t apollo-boilerplate .

// コンテナの開始
$ docker run -dp 4000:4000 apollo-boilerplate
```
