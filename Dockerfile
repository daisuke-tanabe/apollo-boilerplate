FROM node:18.12.1
ENV NODE_ENV development

RUN npm install -g prisma

WORKDIR /app

# docker composeのinitオプションが有効になっているので不要だと思いますが確信が持てたら削除します
# ゾンビプロセスの終了のため
# https://github.com/krallin/tini
#RUN apk add --no-cache tini
#ENTRYPOINT ["/sbin/tini", "--"]

# 先に依存関係ファイルをコピーする
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
