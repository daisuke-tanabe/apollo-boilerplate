import http, { type IncomingHttpHeaders } from 'http';

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

type Authorization = IncomingHttpHeaders['authorization'];
type MyContext = {
  token: Authorization;
};

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

const getToken = (authorization: Authorization) => {
  return authorization?.replace('Bearer', '').trim();
};

const verifyToken = (token: string | undefined) => {
  return decode({
    token,
    secret: process.env.NEXTAUTH_SECRET as string,
  }).catch(() => null);
};

// prismaチートシート
// https://qiita.com/koffee0522/items/92be1826f1a150bfe62e
const resolvers = {
  Query: {
    books: () => books,
    // TODO 現状はアクセストークンの内容を返却するだけ
    // https://www.apollographql.com/docs/apollo-server/data/resolvers/#handling-arguments
    user: async (parent: unknown, args: unknown, { token }: MyContext) => {
      const accessToken = await verifyToken(token);
      return accessToken && { ...accessToken };
    },
    users: async () => {
      const user = await prisma.user.findMany();
      return user;
    },
  },
};

const server = new ApolloServer<MyContext>({
  // サブグラフスキーマにしないとBFFのGraphqlからAPIを叩くことができない
  // https://www.apollographql.com/docs/apollo-server/using-federation/api/apollo-subgraph/#buildsubgraphschema
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
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
      return {
        token: getToken(req.headers.authorization),
      };
    },
  }),
);

new Promise<void>((resolve) => {
  httpServer.listen({ port: 4000 }, resolve);
}).then(() => {
  console.log(`🚀 Server ready at http://localhost:4000/`);
});
