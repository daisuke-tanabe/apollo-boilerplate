FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm ci

CMD ["node", "--loader", "ts-node/esm", "src/index.ts"]

EXPOSE 4000
