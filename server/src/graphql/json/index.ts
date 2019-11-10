import { gql } from "apollo-server";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";

export const typeDefs = gql`
  scalar JSON
  scalar JSONObject
`;

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject
};
