import * as request from "supertest";
import { appSetup, profile, login, signup } from "../util";
import { getDBName, getProfileSecret } from "../../src/couchdb-proxy";

import crypto = require("crypto");

describe("couchdb > local database isolation", () => {
  const testSignup = {
    email: "test-couchdb-1@mailinator.com",
    fullName: "test-couchdb-1",
    password: "password",
    confirmPassword: "password"
  };

  const refs = appSetup();

  it("should not allow a non logged-in client to access any couchdb database", async () => {
    let response;
    const agent = request.agent(refs.app);

    response = await agent.get("/couchdb");
    expect(response.status).toBe(401);
  });

  it("should only show the user their own database.", async () => {
    let response;
    const agent = request.agent(refs.app);

    response = await signup(agent, testSignup);
    expect(response.status).toBe(200);
    expect(response.body.data.signup.success).toBe(true);

    response = await login(agent, testSignup.email, testSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    response = await profile(agent);

    const profileRecord = {
      provider: response.body.data.profile.provider,
      id: response.body.data.profile.id
    };

    response = await agent.get("/couchdb");
    expect(response.status).toBe(200);
    expect(response.body.db_name).toEqual(getDBName(profileRecord));
  });

  it("should not allow an external client to set their couchdb role through custom headers.", async () => {
    let response;
    const agent = request.agent(refs.app);

    response = await login(agent, testSignup.email, testSignup.password);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/pass");

    let token;
    if (
      process.env.COUCHDB_AUTH_SECRET &&
      process.env.COUCHDB_AUTH_SECRET.length > 0
    ) {
      token = crypto
        .createHmac("sha1", process.env.COUCHDB_AUTH_SECRET)
        .update("hackerman")
        .digest("hex");
    }

    let req = agent
      .delete("/couchdb")
      .set("x-auth-couchdb-username", "hackerman")
      .set("x-auth-couchdb-roles", "_admin");

    if (token) {
      req = req.set("x-auth-couchdb-token", token);
    }

    response = await req;

    expect(response.status).toBe(401);
  });
});
