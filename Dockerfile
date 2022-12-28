FROM node:18.12.1
ENV NODE_ENV development

WORKDIR /app

# 先に依存関係ファイルをコピーする（意味がないかも？後で見直す）
COPY package*.json ./

RUN npm ci
