import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import serverlessExpress from '@vendia/serverless-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { gql } from 'graphql-tag';
import http from 'http';
import { decode } from 'next-auth/jwt';
import fetch from "node-fetch";

const typeDefs = gql`
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
    // https://www.apollographql.com/docs/apollo-server/data/resolvers/#handling-arguments
    books: () => books,
    // TODO 適当にAnyにしたので後で直す
    user: (parent: any, args: any, contextValue: any) => {
      return {
        ...contextValue
      }
    }
  },
};

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

app.use(cookieParser());

app.use(
  // corsはserverless.ymlで設定している
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const authorization = req.headers.authorization?.replace('Bearer', '').trim();

      if (authorization) {
        const decodedToken = await decode({
          token: authorization,
          secret: process.env.NEXTAUTH_SECRET as string
        });

        return { ...decodedToken };
      }

      return {
        name: '',
        email: ''
      }
    },
  })
);

// This final export is important!
export const graphqlHandler = serverlessExpress({ app });
