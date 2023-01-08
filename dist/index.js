import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { CryptoCompareAPI } from "./DataSources/CryptoCompareAPI.js";
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type User {
    id: ID!
    name: String
  }

   "This Book type defines the queryable fields for every book in our data source."
  type Book {
    """
    title will be used for the book title
    """
    title: String
    author: String
  }

  input BookInfo {
    title: String
    author: String
  }

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
    books: [Book]
    numberSix: Int!
    numberSeven: Int!
    user(id: ID!): User
    listCoins(page: Int!): [Coin]
    listHistory(params: HistoryParams): [Point]
  }

  type Mutation {
    addBook(title: String, author: String): Book
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
const port = Number(process.env.port) || 3000;
const { url } = await startStandaloneServer(server, {
    context: async () => ({
        // We create new instances of our data sources with each request,
        // passing in our server's cache.
        dataSources: {
            cryptoCompareApi: new CryptoCompareAPI(),
        }
    }),
    //  listen: { port: port }
});
console.log(`🚀  Server ready at: ${url}`);
// export const graphqlHandler = startServerAndCreateLambdaHandler(server, {
//   context: async () => ({
//      // We create new instances of our data sources with each request,
//      // passing in our server's cache.
//      dataSources: {
//       cryptoCompareApi: new CryptoCompareAPI(),
//      }
//    }),
// }); 
export const graphqlHandler = startServerAndCreateLambdaHandler(server, {
    context: async () => ({
        // We create new instances of our data sources with each request,
        // passing in our server's cache.
        dataSources: {
            cryptoCompareApi: new CryptoCompareAPI(),
        }
    }),
});
