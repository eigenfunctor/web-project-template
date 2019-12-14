import * as request from "supertest";
import { Connection } from "typeorm";
import { appSetup, graphqlRequest, profile, login, signup } from "../util";
import {
  ApiUser,
  EmailVerification,
  LocalUser,
  PasswordReset
} from "../../src/entity";

describe("local account > signup, verify, login/logout, reset password", () => {
  const refs = appSetup();

  const countLocalUsersQuery: (db: Connection) => [string, any[]] = db =>
    db.manager
      .createQueryBuilder()
      .select(["COUNT(*) as count"])
      .from(LocalUser, "local_user")
      .getQueryAndParameters();

  it("should not signup an invalid user.", async () => {
    let response;
    let dbresults;
    let beforeCount;
    let afterCount;

    const invalids = [
      {
        form: {
          email: "",
          fullName: "test255",
          password: "mypassword",
          confirmPassword: "mypassword"
        },
        errorLengths: {
          email: 1,
          password: 0
        }
      },
      {
        form: {
          email: "test255@mailinator.com",
          fullName: "test255",
          password: "password",
          confirmPassword: "mypassword"
        },
        errorLengths: {
          email: 0,
          password: 1
        }
      },
      {
        form: {
          email: "test255@mailinator.com",
          fullName: "test255",
          password: "",
          confirmPassword: ""
        },
        errorLengths: {
          email: 0,
          password: 1
        }
      },
      {
        form: {
          email: "",
          fullName: "test255",
          password: "",
          confirmPassword: ""
        },
        errorLengths: {
          email: 1,
          password: 1
        }
      }
    ];

    invalids.forEach(async vars => {
      const agent = request.agent(refs.app);
      dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
      beforeCount = dbresults && dbresults[0] && dbresults[0].count;

      response = await signup(agent, vars.form, true);
      expect(response.status).toEqual(200);

      dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
      afterCount = dbresults && dbresults[0] && dbresults[0].count;

      expect(beforeCount).toEqual(afterCount);

      response = await signup(agent, vars.form, false);
      expect(response.status).toEqual(200);

      expect(response.body.data.signup.success).toBe(false);
      expect(response.body.data.signup.inputErrors.email.length).toEqual(
        vars.errorLengths.email
      );
      expect(response.body.data.signup.inputErrors.password.length).toEqual(
        vars.errorLengths.password
      );

      dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
      afterCount = dbresults && dbresults[0] && dbresults[0].count;

      expect(beforeCount).toEqual(afterCount);
    });
  });

  const validSignup = {
    email: "test255@mailinator.com",
    fullName: "test255",
    password: "mypassword",
    confirmPassword: "mypassword"
  };

  it("should signup a valid user.", async () => {
    const agent = request.agent(refs.app);
    let response;
    let dbresults;
    let beforeCount;
    let afterCount;

    const signupSuccess = {
      success: true,
      inputErrors: {
        email: [],
        password: []
      }
    };

    dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
    beforeCount = dbresults && dbresults[0] && dbresults[0].count;

    response = await signup(agent, validSignup, true);
    expect(response.status).toEqual(200);
    expect(response.body.data.signup).toEqual(signupSuccess);

    dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
    afterCount = dbresults && dbresults[0] && dbresults[0].count;

    expect(beforeCount).toEqual(afterCount);

    dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
    beforeCount = dbresults && dbresults[0] && dbresults[0].count;

    response = await signup(agent, validSignup, false);
    expect(response.status).toEqual(200);
    expect(response.body.data.signup).toEqual(signupSuccess);

    dbresults = await refs.db.manager.query(...countLocalUsersQuery(refs.db));
    afterCount = dbresults && dbresults[0] && dbresults[0].count;

    expect(parseInt(beforeCount) + 1).toEqual(parseInt(afterCount));
  });

  it("should fail to login with bad credentials.", async () => {
    const invalids = [
      { email: validSignup.email, password: "badpassword" },
      { email: "unknown@mailinator.com", password: validSignup.password }
    ];

    invalids.forEach(async vars => {
      const agent = request.agent(refs.app);
      const response = await login(agent, vars.email, vars.password);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/fail");
    });
  });

  it("should login and logout a user with correct credentials.", async () => {
    const agent = request.agent(refs.app);
    let response;

    await signup(agent, validSignup, false);

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");

    response = await profile(agent);
    expect(response.status).toBe(200);
    expect(response.body.data.profile).not.toBeNull();

    response = await agent.get("/auth/logout");
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/");

    response = await profile(agent);
    expect(response.status).toBe(200);
    expect(response.body.data.profile == null).toBe(true);
  });

  const IS_VERIFIED_QUERY = `
    query {
      isVerified
    }
  `;

  const VERIFY_ACCOUNT_MUTATION = `
    mutation VerifyAccount($verificationID: String!) {
      verifyAccount(verificationID: $verificationID) {
        success
        inputErrors {
          verificationID
        }
      }
    }
  `;

  const RESEND_VERIFICATION_MUTATION = `
    mutation ResendVerification($email: String!) {
      resendVerification(email: $email)
    }
  `;

  const allVerificationsQuery: (db: Connection) => [string, any[]] = db =>
    db.manager
      .createQueryBuilder(EmailVerification, "verification")
      .getQueryAndParameters();

  const verificationsQuery: (
    db: Connection,
    email: string
  ) => [string, any[]] = (db, email) =>
    db.manager
      .createQueryBuilder(EmailVerification, "verification")
      .innerJoin(
        LocalUser,
        "local_user",
        `"local_user"."id" = "verification"."userId"`
      )
      .where(`"local_user"."email" = :email`, {
        email: validSignup.email
      })
      .getQueryAndParameters();

  it("should not send password reset email to a non-existent user.", async () => {
    let response;

    const agent = request.agent(refs.app);

    const beforeVerifications = await refs.db.query(
      ...allVerificationsQuery(refs.db)
    );

    const notRegistered = "notregistered@mailinator.com";
    response = await graphqlRequest(agent, RESEND_VERIFICATION_MUTATION, {
      variables: { email: notRegistered }
    });
    expect(response.status).toEqual(200);

    const afterVerifications = await refs.db.query(
      ...allVerificationsQuery(refs.db)
    );

    expect(beforeVerifications).toEqual(afterVerifications);
  });

  it("should fail to verify the user with an invalid verification ID.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");

    response = await graphqlRequest(agent, IS_VERIFIED_QUERY);
    expect(response.status).toBe(200);
    expect(response.body.data.isVerified).toBe(false);

    response = await graphqlRequest(agent, VERIFY_ACCOUNT_MUTATION, {
      variables: { verificationID: "not-a-real-id" }
    });
    expect(response.status).toBe(200);
    expect(response.body.data.verifyAccount.success).toBe(false);
    const verificationErrorLength =
      response.body.data.verifyAccount.inputErrors.verificationID.length;
    expect(verificationErrorLength).toBe(1);

    response = await graphqlRequest(agent, IS_VERIFIED_QUERY);
    expect(response.status).toBe(200);
    expect(response.body.data.isVerified).toBe(false);
  });

  it("should verify the user using a valid verification ID.", async () => {
    let response;

    const agent = request.agent(refs.app);

    const matches = await refs.db.manager.query(
      ...verificationsQuery(refs.db, validSignup.email)
    );

    const id = matches[0].verification_id;
    expect(id).toBeDefined();

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");

    response = await graphqlRequest(agent, IS_VERIFIED_QUERY);
    expect(response.status).toBe(200);
    expect(response.body.data.isVerified).toBe(false);

    response = await graphqlRequest(agent, VERIFY_ACCOUNT_MUTATION, {
      variables: { verificationID: id }
    });
    expect(response.status).toBe(200);
    expect(response.body.data.verifyAccount.success).toBe(true);
    expect(
      response.body.data.verifyAccount.inputErrors.verificationID.length
    ).toBe(0);

    response = await graphqlRequest(agent, IS_VERIFIED_QUERY);
    expect(response.status).toBe(200);
    expect(response.body.data.isVerified).toBe(true);
  });

  const SEND_PASSWORD_RESET_MUTATION = `
    mutation SendPasswordReset($email: String!) {
      sendPasswordReset(email: $email)
    }
  `;

  const CHANGE_PASSWORD_MUTATION = `
    mutation ChangePassword($form: PasswordResetForm!, $validate: Boolean) {
      changePassword(form: $form, validate: $validate) {
        success
        inputErrors {
          resetID
          password
        }
      }
    }
  `;

  const allPasswordResetsQuery: (db: Connection) => [string, any[]] = db =>
    db.manager
      .createQueryBuilder(PasswordReset, "password_reset")
      .getQueryAndParameters();

  const passwordResetQuery: (
    db: Connection,
    email: string
  ) => [string, any[]] = (db, email) =>
    db.manager
      .createQueryBuilder(PasswordReset, "password_reset")
      .innerJoin(
        LocalUser,
        "local_user",
        `"local_user"."id" = "password_reset"."userId"`
      )
      .where(`"local_user"."email" = :email`, {
        email
      })
      .getQueryAndParameters();

  it("should not send a password reset email to a non-existent user.", async () => {
    let response;

    const agent = request.agent(refs.app);

    const beforePasswordResets = await refs.db.query(
      ...allPasswordResetsQuery(refs.db)
    );

    const notRegistered = "notregistered@mailinator.com";
    response = await graphqlRequest(agent, SEND_PASSWORD_RESET_MUTATION, {
      variables: { email: notRegistered }
    });
    expect(response.status).toEqual(200);

    const afterPasswordResets = await refs.db.query(
      ...allPasswordResetsQuery(refs.db)
    );

    expect(beforePasswordResets).toEqual(afterPasswordResets);
  });

  it("should not change the user's password using an invalid reset form.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await graphqlRequest(agent, SEND_PASSWORD_RESET_MUTATION, {
      variables: { email: validSignup.email }
    });
    expect(response.status).toEqual(200);

    const matches = await refs.db.manager.query(
      ...passwordResetQuery(refs.db, validSignup.email)
    );
    const id = matches[0].password_reset_id;
    expect(id).toBeDefined();

    const invalids = [
      {
        form: {
          resetID: "incorrect ID",
          password: "mypassword",
          confirmPassword: "mypass"
        },
        errorLengths: { resetID: 1, password: 1 }
      },
      {
        form: {
          resetID: id,
          password: "mypassword",
          confirmPassword: "mypass"
        },
        errorLengths: { resetID: 0, password: 1 }
      },
      {
        form: {
          resetID: "incorrect ID",
          password: "mypassword",
          confirmPassword: "mypassword"
        },
        errorLengths: { resetID: 1, password: 0 }
      }
    ];

    invalids.forEach(async vars => {
      response = await graphqlRequest(agent, CHANGE_PASSWORD_MUTATION, {
        variables: { form: vars.form }
      });
      expect(response.status).toBe(200);
      const results = response.body.data.changePassword;
      expect(results.success).toBe(false);
      expect(results.inputErrors.resetID.length).toBe(
        vars.errorLengths.resetID
      );
      expect(results.inputErrors.password.length).toBe(
        vars.errorLengths.password
      );
    });
  });

  it("should change the user's password using a valid reset form.", async () => {
    let response;

    const agent = request.agent(refs.app);

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");

    response = await agent.get("/auth/logout");
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/");

    response = await graphqlRequest(agent, SEND_PASSWORD_RESET_MUTATION, {
      variables: { email: validSignup.email }
    });
    expect(response.status).toEqual(200);

    const matches = await refs.db.manager.query(
      ...passwordResetQuery(refs.db, validSignup.email)
    );
    const id = matches[0].password_reset_id;
    expect(id).toBeDefined();

    const form = {
      resetID: id,
      password: "mynewpassword",
      confirmPassword: "mynewpassword"
    };

    let inputErrors;

    // Only validate reset form.
    response = await graphqlRequest(agent, CHANGE_PASSWORD_MUTATION, {
      variables: { form, validate: true }
    });
    expect(response.status).toBe(200);
    expect(response.body.data.changePassword.success).toBe(true);
    inputErrors = response.body.data.changePassword.inputErrors;
    expect(inputErrors).toBeDefined();
    expect(inputErrors.resetID.length).toBe(0);
    expect(inputErrors.password.length).toBe(0);

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");

    response = await agent.get("/auth/logout");
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/");

    // Commit reset form.
    response = await graphqlRequest(agent, CHANGE_PASSWORD_MUTATION, {
      variables: { form }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.changePassword.success).toBe(true);
    inputErrors = response.body.data.changePassword.inputErrors;
    expect(inputErrors).toBeDefined();
    expect(inputErrors.resetID.length).toBe(0);
    expect(inputErrors.password.length).toBe(0);

    response = await login(agent, validSignup.email, validSignup.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/fail");

    response = await login(agent, validSignup.email, form.password);
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/pass");
  });
});
