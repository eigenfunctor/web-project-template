import { gql } from "apollo-server";
import { Connection } from "typeorm";
import { createTablePredicateTypeMap } from "./table-filter";

export * from "./table-filter";

export const typeDefs = gql`
  extend type Query {
    tableFilterPredicates: [String!]!
  }

  type ColumnHeader {
    key: String!
    name: String!
  }

  input TableQueryInput {
    sortKey: String
    sortDir: String
    filters: [TableFilterInput!]
    skip: Int!
    limit: Int!
  }

  input TableFilterInput {
    constraints: [TableConstraintInput!]!
  }

  input TableConstraintInput {
    negate: Boolean
    predicate: TablePredicateInput!
  }

  input TablePredicateInput {
    predicateType: String!
    column: String!
    value: String!
  }
`;

export const resolvers = {
  Query: {
    tableFilterPredicates() {
      return Object.keys(createTablePredicateTypeMap([]));
    }
  }
};
