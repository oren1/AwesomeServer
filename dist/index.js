import { ApolloServer } from '@apollo/server';
import { CryptoCompareAPI } from "./DataSources/CryptoCompareAPI.js";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import Express, { json } from 'express';
import cors from 'cors';
import http from 'http';
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const app = Express();
const httpServer = http.createServer(app);
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  type Coin {
    id: String
    symbol: String
    coinName: String
    imageUrl: String
  }

  input HistoryParams {
    fsym: String
    tsym: String
    limit: Int
    aggregate: Int
  }

  type Point {
    x: Float
    y: Float
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    listCoins(page: Int!): [Coin]
    listHistory(params: HistoryParams): [Point]
  }

  # type Mutation {}
`;
// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        listCoins(_, { page }, { dataSources }) {
            return dataSources.cryptoCompareApi.getCoinsList(page);
        },
        listHistory(_, { params }, { dataSources }) {
            let { fsym, tsym, limit, aggregate } = params;
            return dataSources.cryptoCompareApi.fetchHistory(fsym, tsym, limit, aggregate);
        }
    },
    // Mutation: {
    // } 
};
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();
app.use('/', cors(), 
// 50mb is the limit that `startStandaloneServer` uses, but you may configure this to suit your needs
json({ limit: '50mb' }), 
// expressMiddleware accepts the same arguments:
// an Apollo Server instance and optional configuration options
expressMiddleware(server, {
    context: async ({ req }) => ({
        token: "",
        dataSources: {
            cryptoCompareApi: new CryptoCompareAPI(),
        }
    }),
}));
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);
// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
// const port = Number(process.env.port)  || 3000;
// const { url } = await startStandaloneServer(server, {
//   context: async () => ({
//      // We create new instances of our data sources with each request,
//      // passing in our server's cache.
//      dataSources: {
//       cryptoCompareApi: new CryptoCompareAPI(),
//      }
//    }),
//    listen: { port: port }
// });
// console.log(`🚀  Server ready at: ${url}`);
// export const graphqlHandler = startServerAndCreateLambdaHandler(server, {
//       context: async () => ({
//      // We create new instances of our data sources with each request,
//      // passing in our server's cache.
//      dataSources: {
//       cryptoCompareApi: new CryptoCompareAPI(),
//      }
//    }),
// }); 
