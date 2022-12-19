import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';
import http from 'http';


const typeDefs = `#graphql
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
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

app.use(
  cors(),
  express.json(),
  expressMiddleware(server)
);

// This final export is important!
export const graphqlHandler = serverlessExpress({ app });
