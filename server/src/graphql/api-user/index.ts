import { gql } from "apollo-server";
import { Admin } from "../../entity";

export const typeDefs = gql`
  extend type Query {
    profile: ApiUser
  }

  type ApiUser {
    id: String!
    provider: String!
    emails: [String!]
  }

  input ProfileInput {
    id: String!
    provider: String!
  }
`;

export const resolvers = {
  Query: {
    profile(_, __, { profile }) {
      return profile;
    }
  }
};
