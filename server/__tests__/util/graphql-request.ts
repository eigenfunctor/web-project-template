import { Application } from "express";
import * as request from "supertest";

export interface GraphQLOptions {
  operationName?: string;
  variables?: object;
}
export async function graphqlRequest(
  agent: request.SuperTest<request.Test>,
  query: string,
  options?: GraphQLOptions
): Promise<request.Response> {
  return agent
    .post("/graphql")
    .set("Accept", "application/json")
    .send({ ...(options || {}), query });
}
