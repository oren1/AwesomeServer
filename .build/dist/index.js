import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = readFileSync('./src/schema.graphql', { encoding: 'utf-8' });
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
const users = [
    {
        id: '1',
        name: 'Elizabeth Bennet',
    },
    {
        id: '2',
        name: 'Fitzwilliam Darcy',
    },
];
// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        books: () => books,
        numberSix: () => 6,
        numberSeven: () => 7,
        user(parent, args, context, info) {
            return users.find((user) => user.id === args.id);
        },
        listCoins(_, { page }, { dataSources }) {
            return dataSources.cryptoCompareApi.getCoinsList(page);
        },
        listHistory(_, { params }, { dataSources }) {
            let { fsym, tsym, limit, aggregate } = params;
            return dataSources.cryptoCompareApi.fetchHistory(fsym, tsym, limit, aggregate);
        }
    },
    Mutation: {
        addBook: (_, args) => {
            const book = {
                title: args.title,
                author: args.author
            };
            books.push(book);
            return book;
        }
    }
};
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
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
//   //  listen: { port: port }
// });
export const graphqlHandler = startServerAndCreateLambdaHandler(server);