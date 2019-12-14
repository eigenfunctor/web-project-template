import { Application } from "express";
import * as request from "supertest";
import { graphqlRequest } from "../util";
import { Profile } from "../../src/auth/profile";

export async function profile(
  agent: request.SuperTest<request.Test>
): Promise<request.Response> {
  const PROFILE_QUERY = `
    query {
      profile {
        provider
        id
        loggedEmail
        loggedName
      }
    }
  `;

  return graphqlRequest(agent, PROFILE_QUERY);
}

export async function login(
  agent: request.SuperTest<request.Test>,
  email: string,
  password: string,
  redirects?: {
    successRedirect?: string;
    failureRedirect?: string;
  }
): Promise<request.Response> {
  return agent.post("/auth/provider/local").send({
    email,
    password,
    successRedirect: (redirects && redirects.successRedirect) || "/pass",
    failureRedirect: (redirects && redirects.failureRedirect) || "/fail"
  });
}

export async function signup(
  agent: request.SuperTest<request.Test>,
  form: object,
  validate?: boolean
): Promise<request.Response> {
  const SIGNUP_MUTATION = `
    mutation Signup($form: SignupForm!, $validate: Boolean) {
      signup(form: $form, validate: $validate) {
        success
        inputErrors {
          email
          password
        }
      }
    }
  `;

  const variables = { form, validate };

  return graphqlRequest(agent, SIGNUP_MUTATION, { variables });
}
