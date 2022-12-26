import http from 'http';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { gql } from 'graphql-tag';
import { decode } from 'next-auth/jwt';

const prisma = new PrismaClient();

dotenv.config();

const app = express();

const httpServer = http.createServer(app);

const typeDefs = gql`
  type Book {
    id: Int
    title: String
    author: String
  }

  type DBUser {
    id: ID
    name: String
    email: String
  }

  type User {
    name: String
    email: String
    picture: String
    sub: String
    iat: Int
    exp: Int
    jti: String
  }

  type Query {
    books: [Book]
    user: User
    users: [DBUser]
  }
`;

const books = [
  {
    id: '1',
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    id: '2',
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

// prismaチートシート
// https://qiita.com/koffee0522/items/92be1826f1a150bfe62e
const resolvers = {
  Query: {
    books: () => books,
    // https://www.apollographql.com/docs/apollo-server/data/resolvers/#handling-arguments
    // TODO 適当にAnyにしたので後で直す
    user: (parent: any, args: any, contextValue: any) => {
      return {
        ...contextValue,
      };
    },
    users: async () => {
      const user = await prisma.user.findMany();
      return {
        ...prisma.user.findMany()
      }
    }
  },
};

const server = new ApolloServer({
  // サブグラフスキーマを返す関数
  // https://www.apollographql.com/docs/apollo-server/using-federation/api/apollo-subgraph/#buildsubgraphschema
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(cookieParser());

app.use(
  '/',
  cors<cors.CorsRequest>({
    origin: ['http://localhost:3000'],
    credentials: true,
  }),
  bodyParser.json({ limit: '50mb' }),
  expressMiddleware(server, {
    context: async ({ req }) => {
      // FEから渡されたトークンを検証して内包情報をresolverに渡す処理
      // TODO 期限切れ確認してレスポンスを返す処理が必要
      const authorization = req.headers.authorization?.replace('Bearer', '').trim();
      if (authorization) {
        const decodedToken = await decode({
          token: authorization,
          secret: process.env.NEXTAUTH_SECRET as string,
        });
        return { ...decodedToken };
      }

      // TODO これも適当な処理なので後で削除する
      return {
        name: '',
        email: '',
      };
    },
  }),
);

new Promise<void>((resolve) => {
  httpServer.listen({ port: 4000 }, resolve);
}).then(() => {
  console.log(`🚀 Server ready at http://localhost:4000/`);
});
