import { Application } from "express";
import * as request from "supertest";
import { graphqlRequest } from "../util";

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
  validate: boolean
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
