import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import serverlessExpress from '@vendia/serverless-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { decode } from "next-auth/jwt";

const typeDefs = `#graphql
  type Book {
    id: String
    title: String
    author: String
  }

  type Query {
    books: [Book]
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
  },
};

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

app.use(cookieParser());

app.use(
  // serverless.ymlで設定している
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      // TODO ローカルと本番でキー名が異なるので後で対応を考える
      const token = req.cookies['__Secure-next-auth.session-token'];
      const decodedToken = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET as string
      })
      console.log(decodedToken)
      return {};
    },
  })
);

// This final export is important!
export const graphqlHandler = serverlessExpress({ app });
