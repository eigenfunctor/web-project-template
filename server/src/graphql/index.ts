import { gql } from "apollo-server";
import { ApolloServer } from "apollo-server-express";
import { Connection } from "typeorm";
import * as admin from "./accounts/admin";
import * as apiUser from "./accounts/api-user";
import * as localAccount from "./accounts/local-account";
import * as table from "./table";
import * as json from "./json";

const baseTypeDefs = gql`
  type Query
  type Mutation
`;

const typeDefs = [
  baseTypeDefs,
  json.typeDefs,
  admin.typeDefs,
  apiUser.typeDefs,
  localAccount.typeDefs,
  table.typeDefs
];

const resolvers = [
  json.resolvers,
  admin.resolvers,
  apiUser.resolvers,
  localAccount.resolvers,
  table.resolvers
];

const createServer = (db: Connection) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ db, profile: req.user }),
    playground: {
      settings: {
        "request.credentials": "include"
      }
    }
  });

export default createServer;
