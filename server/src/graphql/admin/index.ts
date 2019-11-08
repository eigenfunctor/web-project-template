import { Connection } from "typeorm";
import { gql, ForbiddenError } from "apollo-server";
import { ApiUser, Admin } from "../../entity";

export const typeDefs = gql`
  extend type Query {
    isAdmin(profile: ProfileInput!): Boolean!

    users(params: UsersQueryInput!): [ApiUser!]
  }

  extend type Mutation {
    setAdmin(
      userProfile: ProfileInput!
      isAdmin: Boolean!
      overrideCode: String
    ): SetAdminResult!
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

  type SetAdminResult {
    success: Boolean!
    errors: [String!]!
  }
`;

export const resolvers = {
  Query: {
    // Assert if the logged in user is an administrator.
    async isAdmin(_, { profile }, { db }) {
      return isAdminHelper(db, profile);
    },

    // Return a paginated list of users if the authorized profile belongs to an admin.
    async users(_, { params }, { db, profile }) {
      const { search, sort, skip, limit } = params;

      const isAdmin = await isAdminHelper(db, profile);

      if (!isAdmin) {
        throw new ForbiddenError("Unauthorized.");
      }

      //TODO: return list of users
      return [];
    }
  },
  Mutation: {
    /**
     * Set an ApiUser asscaited to the provider/id pair in
     * the given profile record to the isAdmin parameter.
     * If the SET_ADMIN_OVERRIDE_CODE is set to some string,
     * then passing that string as overrideCode allows the request
     * to succeed without adminstrative rights.
     * This should only be used to bootstrap the first
     * administrator into the database.
     */
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
