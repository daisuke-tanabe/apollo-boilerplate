FROM node:18-alpine
ENV NODE_ENV production

WORKDIR /app

# ゾンビプロセスの終了のため
# https://github.com/krallin/tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# 先に依存関係ファイルをコピーする
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .
CMD ["node", "--loader", "ts-node/esm", "src/index.ts"]

EXPOSE 4000
