import { Connection } from "typeorm";
import { gql, ForbiddenError, ApolloError } from "apollo-server";
import { ApiUser, LocalUser, Admin } from "../../../entity";
import { runTableQuery } from "../../table";

export const typeDefs = gql`
  extend type Query {
    isAdmin(profile: ProfileInput!): Boolean!

    allUsers(query: TableQueryInput!): AllUsersTable!
  }

  extend type Mutation {
    setAdmin(profile: ProfileInput!, isAdmin: Boolean!): Boolean
  }

  type AllUsersTable {
    header: [ColumnHeader!]!
    rows: [AllUsersRow!]!
    count: Int
  }

  type AllUsersRow {
    id: String!
    provider: String!
    loggedName: String
    loggedEmail: String
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

    // Return a paginated list of users if the session profile belongs to an admin.
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

      const { rows, count } = await runTableQuery(
        db,
        qb,
        query,
        qb => qb.orWhere.bind(qb),
        qb => qb.andWhere.bind(qb),
        ALL_USERS_HEADER.map(h => h.key)
      );

      return {
        header: ALL_USERS_HEADER,
        rows,
        count
      };
    }
  },
  Mutation: {
    // Set an ApiUser asscaited to the provider/id pair in the given profile record to the isAdmin parameter.
    async setAdmin(
      _,
      { profile, isAdmin },
      { db, profile: sessionProfile }: { db: Connection; profile?: any }
    ) {
      if (!(await checkIsAdmin(db, sessionProfile))) {
        throw new ForbiddenError("Unauthorized.");
      }

      const localUser =
        profile.provider === "local" &&
        (await db.manager.findOne(LocalUser, { id: profile.id }));

      if (localUser && localUser.email === "root") {
        throw new ForbiddenError("Unauthorized.");
      }

      let adminStatus = false;
      await db.transaction(async tx => {
        const user = await tx.findOne(ApiUser, profile);

        if (!user) {
          throw new ApolloError("User profile does match any records.");
        }

        const adminMatches = await tx.query(
          ...tx
            .createQueryBuilder(Admin, "admin")
            .where(
              `"admin"."userProvider" = :provider AND "admin"."userId" = :id`,
              {
                provider: user.provider,
                id: user.id
              }
            )
            .getQueryAndParameters()
        );

        let admin =
          adminMatches[0] &&
          (await tx.findOne(Admin, { id: adminMatches[0].admin_id }));

        if (!isAdmin) {
          if (admin) {
            await tx.remove(admin);
          }

          adminStatus = false;
          return;
        }

        if (!admin) {
          admin = new Admin();
        }

        admin.user = user;

        await tx.save(admin);

        adminStatus = true;
      });

      return adminStatus;
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

  if (!(provider && id)) {
    return false;
  }

  const result = await db.manager.query(
    ...db.manager
      .createQueryBuilder(Admin, "admin")
      .where(`"admin"."userProvider" = :provider AND "admin"."userId" = :id`, {
        provider,
        id
      })
      .getQueryAndParameters()
  );

  return result.length > 0;
}
