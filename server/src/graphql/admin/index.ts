import { Connection } from "typeorm";
import { gql, ForbiddenError, ApolloError } from "apollo-server";
import { ApiUser, LocalUser, Admin } from "../../entity";
import { buildTableQuery } from "../table";

export const typeDefs = gql`
  extend type Query {
    isAdmin(profile: ProfileInput!): Boolean!

    allUsers(query: TableQueryInput!): AllUsersTable!
  }

  extend type Mutation {
    setAdmin(
      userProfile: ProfileInput!
      isAdmin: Boolean!
      overrideCode: String
    ): Boolean
  }

  type AllUsersTable {
    header: [ColumnHeader!]!
    rows: [AllUsersRow!]!
  }

  type AllUsersRow {
    id: String!
    provider: String!
    loggedName: String!
    loggedEmail: String!
    isAdmin: Boolean!
  }
`;

const ALL_USERS_HEADER = [
  { key: "provider", name: "Authorization Provider" },
  { key: "loggedName", name: "Last Logged Name" },
  { key: "loggedEmail", name: "Last Logged Email" },
  { key: "isAdmin", name: "Administrator" }
];

export const resolvers = {
  Query: {
    // Assert if the logged in user is an administrator.
    async isAdmin(_, { profile }, { db }: { db: Connection }) {
      return checkIsAdmin(db, profile);
    },

    // Return a paginated list of users if the authorized profile belongs to an admin.
    async allUsers(
      _,
      { query },
      { db, profile }: { db: Connection; profile?: any }
    ) {
      if (!(await checkIsAdmin(db, profile))) {
        throw new ForbiddenError("Unauthorized.");
      }

      const qb = db.manager
        .createQueryBuilder()
        .select([
          `api_user.provider AS "provider"`,
          `api_user.id AS "id"`,
          `api_user.loggedName AS "loggedName"`,
          `api_user.loggedEmail AS "loggedEmail"`,
          `CASE WHEN admin.id IS NULL THEN FALSE ELSE TRUE END AS "isAdmin"`
        ])
        .from(ApiUser, "api_user")
        .leftJoin(
          Admin,
          "admin",
          "admin.user.provider = api_user.provider AND admin.user.id = api_user.id"
        );

      const filterQB = buildTableQuery(
        db,
        qb,
        query,
        qb => qb.orWhere.bind(qb),
        qb => qb.andWhere.bind(qb),
        ALL_USERS_HEADER.map(h => h.key)
      );

      const rows = await db.manager.query(...filterQB.getQueryAndParameters());

      return {
        header: ALL_USERS_HEADER,
        rows
      };
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
    async setAdmin(
      _,
      { userProfile, isAdmin, overrideCode },
      { db, profile }: { db: Connection; profile?: any }
    ) {
      const override =
        typeof process.env.SET_ADMIN_OVERRIDE_CODE === "string" &&
        process.env.SET_ADMIN_OVERRIDE_CODE === overrideCode;

      if (override) {
        console.log(`
WARNING: User with provider: ${userProfile.provider} and ID: ${userProfile.id} had
their admin status changed to ${isAdmin} using the SET_ADMIN_OVERRIDE_CODE environment variable.
        `);
      }

      if (!(override || (await checkIsAdmin(db, profile)))) {
        throw new ForbiddenError("Unauthorized.");
      }

      const user = await db.manager.findOne(ApiUser, userProfile);

      if (!user) {
        throw new ApolloError("User profile does match any records.");
      }

      let admin = await db.manager.findOne(Admin, { user });

      if (!isAdmin) {
        await db.manager.remove(admin);
        return false;
      }

      if (!admin) {
        admin = new Admin();
        admin.user = user;
      }

      await db.manager.save(admin);

      return true;
    }
  }
};

export async function checkIsAdmin(
  db: Connection,
  profile: { id: string; provider: string }
): Promise<boolean> {
  if (!profile) {
    return false;
  }

  const { provider, id } = profile;

  const admin = await db.manager
    .createQueryBuilder(Admin, "admin")
    .innerJoinAndSelect("admin.user", "user")
    .where("user.id = :id AND user.provider = :provider", { provider, id });

  return !!admin;
}
