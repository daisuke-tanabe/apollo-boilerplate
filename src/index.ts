import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { gql } from 'graphql-tag';
import http from 'http';
import { decode } from 'next-auth/jwt';
import fetch from 'node-fetch';

interface MyContext {
  token?: String;
}

const app = express();

const httpServer = http.createServer(app);

const typeDefs = gql`
  type Book {
    id: String
    title: String
    author: String
  }

  type User {
    name: String
    email: String
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

const server = new ApolloServer<MyContext>({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(cookieParser());

app.use(
  '/',
  cors<cors.CorsRequest>({
    origin: ['http://localhost:3000'],
    credentials: true
  }),
  bodyParser.json({ limit: '50mb' }),
  expressMiddleware(server, {
    context: async ({ req }) => {
      console.log('authorization', req.headers.authorization);

      const authorization = req.headers.authorization?.replace('Bearer', '').trim();
      // console.log('authorization:', authorization);

      if (authorization) {
        const decodedToken = await decode({
          token: authorization,
          secret: process.env.NEXTAUTH_SECRET as string
        });
        // console.log('decodedToken:', decodedToken);

        const response = await fetch('https://api.github.com/user', {
          headers: {
            // @ts-ignore
            Authorization: `Bearer ${decodedToken.accessToken}`
          }
        });
        // console.log(response);

        // // TODO このアサートは悪いやり方なので後で直す
        const data = await response.json() as { name: string, email: string };

        // console.log(data);

        return {
          name: data.name,
          email: data.email
        };
      }

      console.log('req.headers.authorizationがないですね')
      return {
        name: '',
        email: ''
      }
    },
  }),
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`🚀 Server ready at http://localhost:4000/`);

