import { Connection } from "typeorm";
import { gql, ForbiddenError } from "apollo-server";
import { ApiUser, Admin } from "../../entity";

export const typeDefs = gql`
  extend type Query {
    users(params: UsersQueryInput!): [ApiUser!]
    isAdmin(profile: ProfileInput!): Boolean!
  }

  input UsersQueryInput {
    search: String
    sort: UsersQuerySort
    skip: Int!
    limit: Int!
  }

  enum UsersQuerySort {
    ASCEND
    DESCEND
  }

  extend type Mutation {
    setAdmin(
      userProfile: ProfileInput!
      isAdmin: Boolean!
      overrideCode: String
    ): SetAdminResult!
  }

  type SetAdminResult {
    success: Boolean!
    errors: [String!]!
  }
`;

export const resolvers = {
  Query: {
    // Return a paginated list of users if the authorized profile belongs to an admin.
    async users(_, { params }, { db, profile }) {
      const { search, sort, skip, limit } = params;

      const isAdmin = await isAdminHelper(db, profile);

      if (!isAdmin) {
        throw new ForbiddenError("Unauthorized.");
      }

      //TODO: return list of users
      return [];
    },

    async isAdmin(_, { profile }, { db }) {
      return isAdminHelper(db, profile);
    }
  },
  Mutation: {
    async setAdmin(_, { userProfile, isAdmin, overrideCode }, { db, profile }) {
      const override =
        typeof process.env.SET_ADMIN_OVERRIDE_CODE === "string" &&
        process.env.SET_ADMIN_OVERRIDE_CODE === overrideCode;

      if (override) {
        console.log(`
WARNING: User with provider: ${userProfile.provider} and ID: ${userProfile.id} had
their admin status changed to ${isAdmin} using the SET_ADMIN_OVERRIDE_CODE environment variable.
        `);
      }

      if (!(override || (await isAdminHelper(db, profile)))) {
        throw new ForbiddenError("Unauthorized.");
      }

      const user = await db.manager.findOne(ApiUser, userProfile);

      if (!user) {
        return { success: false, errors: ["User not found."] };
      }

      let admin = await db.manager.findOne(Admin, { user });

      if (!isAdmin) {
        db.manager.remove(admin);
        return { success: true, errors: [] };
      }

      if (!admin) {
        admin = new Admin();
        admin.user = user;
      }

      db.manager.save(admin);

      return { success: true, errors: [] };
    }
  }
};

async function isAdminHelper(
  db: Connection,
  profile: { id: string; provider: string }
): Promise<boolean> {
  const { provider, id } = profile;

  const admin = await db.manager.findOne(Admin, { user: { provider, id } });

  return !!admin;
}
