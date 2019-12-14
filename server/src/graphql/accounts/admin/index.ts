import { Connection } from "typeorm";
import { gql, ForbiddenError, ApolloError } from "apollo-server";
import { ApiUser, LocalUser, Admin } from "../../../entity";
import { runTableQuery } from "../../table";
import { Profile } from "../../../auth/profile";

import argon2 = require("argon2");

export const typeDefs = gql`
  extend type Query {
    isAdmin: Boolean!

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
    async isAdmin(
      _,
      __,
      { db, profile }: { db: Connection; profile?: Profile }
    ) {
      return checkIsAdmin(db, profile);
    },

    // Return a paginated list of users if the session profile belongs to an admin.
    async allUsers(
      _,
      { query },
      { db, profile }: { db: Connection; profile?: Profile }
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
      { db, profile: sessionProfile }: { db: Connection; profile?: Profile }
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
  profile: Profile
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

export async function updateRootAccount(db: Connection) {
  if (process.env.ENABLE_ROOT_ACCOUNT === "1") {
    console.warn(
      `WARNING: The ENABLE_ROOT_ACCOUNT environment variable is set.`
    );
    console.warn(
      `WARNING: This means anyone can login to an administrator account using the password set by the ROOT_PASSWORD environment variable or "root" by default.`
    );
    console.warn(`WARNING: Unset ENABLE_ROOT_ACCOUNT to subdue this warning.`);
  }

  await db.transaction(async tx => {
    let rootAccount = await tx.findOne(LocalUser, { email: "root" });

    if (!rootAccount) {
      rootAccount = new LocalUser();
    }

    rootAccount.fullName = "root";
    rootAccount.email = "root";
    rootAccount.passwordHash = await argon2.hash(
      process.env.ROOT_PASSWORD && process.env.ROOT_PASSWORD.length > 0
        ? process.env.ROOT_PASSWORD
        : "root"
    );

    await tx.save(rootAccount);

    let apiUser = await tx.findOne(ApiUser, {
      provider: "local",
      id: rootAccount.id
    });

    if (!apiUser) {
      apiUser = new ApiUser();
    }

    apiUser.provider = "local";
    apiUser.id = rootAccount.id;

    apiUser.loggedName = rootAccount.fullName;
    apiUser.loggedEmail = rootAccount.email;

    await tx.save(apiUser);

    const adminMatches = await tx.query(
      ...tx
        .createQueryBuilder(Admin, "admin")
        .where(
          `"admin"."userProvider" = :provider AND "admin"."userId" = :id`,
          { provider: apiUser.provider, id: apiUser.id }
        )
        .getQueryAndParameters()
    );

    let admin =
      adminMatches[0] &&
      (await tx.findOne(Admin, { id: adminMatches[0].admin_id }));

    if (!admin) {
      admin = new Admin();
      admin.user = apiUser;
    }

    await tx.save(admin);
  });
}
