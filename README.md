# apollo-boilerplate

## 開発環境の立ち上げ

`.env.example`をコピーし、`.env`にリネーム。

`.env`内のDBを設定しておく。

`npm install`で依存関係をインストール。

`npx prisma migrate dev --name init`でマイグレーションを実行する。

`npm run dev`で開発環境が立ち上がる。

## 製品版の立ち上げ

```
// コンテナイメージのビルド
$ docker build -t apollo-boilerplate .

// コンテナの開始
$ docker run -dp 4000:4000 apollo-boilerplate
```
