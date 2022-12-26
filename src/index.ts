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

dotenv.config();

const app = express();

const httpServer = http.createServer(app);

const prisma = new PrismaClient();

const typeDefs = gql`
  type Test {
    id: Int
    name: String
    created_at: String
  }

  type Book {
    id: String
    title: String
    author: String
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
    test: [Test]
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
    test: () => prisma.test.findMany(),
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
