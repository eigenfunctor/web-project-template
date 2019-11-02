import { gql } from "apollo-server";
import { ApolloServer } from "apollo-server-express";
import { Connection } from "typeorm";
import * as admin from "./admin";
import * as apiUser from "./api-user";
import * as localAccount from "./local-account";

const baseTypeDefs = gql`
  type Query
  type Mutation
`;

const typeDefs = [
  baseTypeDefs,
  admin.typeDefs,
  apiUser.typeDefs,
  localAccount.typeDefs
];

const resolvers = [admin.resolvers, apiUser.resolvers, localAccount.resolvers];

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
