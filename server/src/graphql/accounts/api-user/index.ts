import { gql } from "apollo-server";
import { Admin } from "../../../entity";
import { Profile } from "../../../auth/profile";

export const typeDefs = gql`
  extend type Query {
    profile: ApiUser
  }

  type ApiUser {
    id: String!
    provider: String!
    loggedName: String
    loggedEmail: String
  }

  input ProfileInput {
    id: String!
    provider: String!
  }
`;

export const resolvers = {
  Query: {
    profile(_, __, { profile }: { profile: Profile }) {
      return profile;
    }
  }
};
