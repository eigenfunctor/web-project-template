import { gql } from "apollo-server";
import { ApolloServer } from "apollo-server-express";
import { Connection } from "typeorm";
import * as admin from "./admin";
import * as apiUser from "./api-user";
import * as localAccount from "./local-account";
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
