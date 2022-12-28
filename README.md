# apollo-boilerplate

## ローカル開発環境について

### 1. 準備

#### 1-1. 環境変数ファイルのコピーとリネーム

`.env.example`をコピーして`.env`にリネーム。

現在は個別で設定してもらうことは特にありません。

#### 1-2. Dockerのインストール

DockerとComposeプラグインをインストールしてください。

インストール手段は任意ですが一番簡単なのでDocker Desktopです。
https://www.docker.com/products/docker-desktop/

### 2. 開発環境の起動

#### 2-1. Docker compose

`$ docker compose up`でイメージの構築とコンテナの構築・実行をする。

Mysqlの起動後、PrismaのDBマイグレーションとデータ注入が実行されてからApollo Serverが立ち上がる。

Dockerに変更が入ったら`$ docker compose up --build`でイメージを再構築すること。

### 3. その他

ローカル開発ではホストとコンテナで`node_modules`の同期をしているため重いかもしれません。

あまりにも重くなったら変更するかもしれません。

DBの永続化をしていないのでコンテナを落とすと初期化されます。
