import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { decode } from 'next-auth/jwt';

interface MyContext {
  token?: String;
}

const app = express();

const httpServer = http.createServer(app);

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

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(cookieParser());

app.use(
  '/',
  cors<cors.CorsRequest>({
    origin: [process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://nextjs-boilerplate-two-rosy.vercel.app'],
    credentials: true
  }),
  bodyParser.json({ limit: '50mb' }),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.cookies['next-auth.session-token'];
      const decodedToken = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET as string
      })
      console.log(decodedToken)
      return {};
    },
  }),
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));

console.log(`🚀 Server ready at http://localhost:4000/`);

