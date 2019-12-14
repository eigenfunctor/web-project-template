import * as request from "supertest";
import { Connection } from "typeorm";
import { appSetup, graphqlRequest, login, signup } from "../util";
import { Admin, ApiUser, LocalUser, PasswordReset } from "../../src/entity";

const nonAdminSignup = {
  email: "nonadmin@mailinator.com",
  fullName: "test non-admin",
  password: "nonadminpass",
  confirmPassword: "nonadminpass"
};

const adminSignup = {
  email: "mainadmin@mailinator.com",
  fullName: "test admin",
  password: "adminpass",
  confirmPassword: "adminpass"
};

const IS_ADMIN_QUERY = `
  query IsAdminQuery {
    isAdmin
  }
`;

const ALL_USERS_QUERY = `
  query AllUsers($query: TableQueryInput!) {
    allUsers(query: $query) {
      header {
        name
        key
      }
    }
  }
`;

const SET_ADMIN_MUTATION = `
  mutation SetAdminMutation($profile: ProfileInput!, $isAdmin: Boolean!) {
    setAdmin(profile: $profile, isAdmin: $isAdmin)
  }
`;

const setupApiUsers = refs => {
  const apiUsers = { admin: null, nonAdmin: null };

  beforeAll(async () => {
    await signup(request.agent(refs.app), adminSignup, false);
    await signup(request.agent(refs.app), nonAdminSignup, false);

    const adminLocalUser = await refs.db.manager.findOne(LocalUser, {
      email: adminSignup.email
    });
    const nonAdminLocalUser = await refs.db.manager.findOne(LocalUser, {
      email: nonAdminSignup.email
    });
    const adminApiUser = await refs.db.manager.findOne(ApiUser, {
      provider: "local",
      id: adminLocalUser.id
    });
    const nonAdminApiUser = await refs.db.manager.findOne(ApiUser, {
      provider: "local",
      id: nonAdminLocalUser.id
    });

    const admin = new Admin();
    admin.user = adminApiUser;

    await refs.db.manager.save(adminApiUser);
    await refs.db.manager.save(admin);
    await refs.db.manager.save(nonAdminApiUser);

    apiUsers.admin = adminApiUser;
    apiUsers.nonAdmin = nonAdminApiUser;
  });

  return apiUsers;
};

const setEnvironementVariables = (rootEnabled, rootPass) => {
  const OLD_ENV = process.env;
  beforeAll(() => {
    process.env.ENABLE_ROOT_ACCOUNT = rootEnabled;
    process.env.ROOT_PASSWORD = rootPass;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });
};

describe("admin > set admin, list users", () => {
  const refs = appSetup();
  const apiUsers = setupApiUsers(refs);

  const profile2AdminRecordQuery: (
    db: Connection,
    profile: { provider: string; id: string }
  ) => [string, any[]] = (db, profile) =>
    db.manager
      .createQueryBuilder(Admin, "admin")
      .where(`"admin"."userProvider" = :provider AND "admin"."userId" = :id`, {
        provider: profile.provider,
        id: profile.id
      })
      .getQueryAndParameters();

  it("should show false admin status on the non-admin profile", async () => {
    let response;

    const agent = request.agent(refs.app);

    // not logged in
    response = await graphqlRequest(agent, IS_ADMIN_QUERY);
    expect(response.status).toBe(200);
    expect(response.body.data.isAdmin).toBe(false);

    response = await login(
      agent,
      nonAdminSignup.email,
      nonAdminSignup.password
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    // logged in
    response = await graphqlRequest(agent, IS_ADMIN_QUERY);
    expect(response.body.data.isAdmin).toBe(false);
  });

  it("should show true admin status on the admin profile", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, adminSignup.email, adminSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, IS_ADMIN_QUERY);
    expect(response.body.data.isAdmin).toBe(true);
  });

  it("should not list all users to a non-admin.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(
      agent,
      nonAdminSignup.email,
      nonAdminSignup.password
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, ALL_USERS_QUERY, {
      variables: { query: { skip: 0, limit: 10 } }
    });
    expect(response.body.data == null).toBe(true);
    expect(response.body.errors).toBeDefined();
  });

  it("should list all users to admins.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, adminSignup.email, adminSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, ALL_USERS_QUERY, {
      variables: { query: { skip: 0, limit: 10 } }
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.errors == null).toBe(true);
  });

  it("should not set or unset a user as admin by a non-admin.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(
      agent,
      nonAdminSignup.email,
      nonAdminSignup.password
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, SET_ADMIN_MUTATION, {
      variables: {
        profile: {
          provider: apiUsers.nonAdmin.provider,
          id: apiUsers.nonAdmin.id
        },
        isAdmin: true
      }
    });
    expect(response.body.errors).toBeDefined();

    const adminRecords = await refs.db.manager.query(
      ...profile2AdminRecordQuery(refs.db, apiUsers.nonAdmin)
    );
    expect(adminRecords.length).toBe(0);
  });

  it("should set and unset a user as admin by another admin.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, adminSignup.email, adminSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, SET_ADMIN_MUTATION, {
      variables: {
        profile: {
          provider: apiUsers.nonAdmin.provider,
          id: apiUsers.nonAdmin.id
        },
        isAdmin: true
      }
    });
    expect(response.status).toBe(200);
    expect(response.body.errors == null).toBe(true);

    let adminRecords;

    adminRecords = await refs.db.manager.query(
      ...profile2AdminRecordQuery(refs.db, apiUsers.nonAdmin)
    );
    expect(adminRecords.length).toBe(1);

    response = await graphqlRequest(agent, SET_ADMIN_MUTATION, {
      variables: {
        profile: {
          provider: apiUsers.nonAdmin.provider,
          id: apiUsers.nonAdmin.id
        },
        isAdmin: false
      }
    });
    expect(response.status).toBe(200);
    expect(response.body.errors == null).toBe(true);

    adminRecords = await refs.db.manager.query(
      ...profile2AdminRecordQuery(refs.db, apiUsers.nonAdmin)
    );
    expect(adminRecords.length).toBe(0);
  });
});

describe("admin > ENABLE_ROOT_ACCOUNT=1", () => {
  const rootPass = "myrootpass";
  setEnvironementVariables("1", rootPass);

  const refs = appSetup();
  const apiUsers = setupApiUsers(refs);

  const getRootProfile = async (db: Connection) => {
    const rootLocalUser = await db.manager.findOne(LocalUser, {
      email: "root"
    });

    const rootApiUser = await (rootLocalUser &&
      db.manager.findOne(ApiUser, {
        provider: "local",
        id: rootLocalUser.id
      }));

    return rootApiUser;
  };

  const rootIsAdmin = async (db: Connection) => {
    const rootApiUser = await getRootProfile(db);
    const matches = await db.manager.query(
      ...db.manager
        .createQueryBuilder(Admin, "admin")
        .where(
          `"admin"."userProvider" = :rootProvider AND "admin"."userId" = :rootID`,
          { rootProvider: rootApiUser.provider, rootID: rootApiUser.id }
        )
        .getQueryAndParameters()
    );

    return matches.length > 0;
  };

  it("should create a root account with a root password", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, "root", rootPass);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");
  });

  it("should not allow demotion of the root account.", async () => {
    let response;

    const agent = request.agent(refs.app);

    const rootApiUser = await getRootProfile(refs.db);

    expect(await rootIsAdmin(refs.db)).toBe(true);

    response = await login(agent, adminSignup.email, adminSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await graphqlRequest(agent, SET_ADMIN_MUTATION, {
      variables: {
        profile: {
          provider: rootApiUser.provider,
          id: rootApiUser.id
        },
        isAdmin: false
      }
    });
    expect(response.body.errors).toBeDefined();

    expect(await rootIsAdmin(refs.db)).toBe(true);
  });
});

describe("admin > ENABLE_ROOT_ACCOUNT=0", () => {
  const rootPass = "myrootpass";
  setEnvironementVariables("0", rootPass);

  const refs = appSetup();
  const apiUsers = setupApiUsers(refs);

  it("should disallow root login if ENABLE_ROOT_ACCOUNT is unset", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, "root", rootPass);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/fail");
  });
});
