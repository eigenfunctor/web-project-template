import fetch, { RequestInit, Response } from "node-fetch";
import * as PouchDB from "pouchdb";
import { Profile } from "../auth/profile";
import { useDocumentModel } from "../document-model";

import crypto = require("crypto");

export function getDocDBBaseURL() {
  return `${process.env.COUCHDB_HOST}`;
}

export function getDBName(profile: Profile): string {
  const dbPrefix = process.env.DOC_DATABASE_NAME_PREFIX || "";

  return `${dbPrefix}_db_${profile.provider}_${profile.id}`;
}

export function getProfileUsername(profile: Profile): string {
  return `user_${profile.provider}_${profile.id}`;
}
export function getProfileRole(profile: Profile): string {
  return `role_${profile.provider}_${profile.id}`;
}

export function getProfileSecret(profile: Profile): string | void {
  if (!process.env.COUCHDB_AUTH_SECRET) {
    return;
  }

  return crypto
    .createHmac("sha1", process.env.COUCHDB_AUTH_SECRET)
    .update(getProfileUsername(profile))
    .digest("hex");
}

export function getFetchHeaders(user: { name: string; roles: string }) {
  let token;

  if (
    process.env.COUCHDB_AUTH_SECRET &&
    process.env.COUCHDB_AUTH_SECRET.length > 0
  ) {
    token = crypto
      .createHmac("sha1", process.env.COUCHDB_AUTH_SECRET)
      .update("db_test_teardown_admin")
      .digest("hex");
  }

  const headers = {
    "x-auth-couchdb-username": user.name,
    "x-auth-couchdb-roles": user.roles,
    "x-auth-couchdb-token": token
  };

  return headers;
}

export async function fetchAs(
  user: { name: string; roles: string },
  url: string,
  opts?: RequestInit
): Promise<Response> {
  const headers = {
    ...((opts && opts.headers) || {}),
    ...getFetchHeaders(user)
  };

  return fetch(url, { ...opts, headers });
}

export async function createDocDatabase(profile: Profile) {
  let res;

  const url = `${getDocDBBaseURL()}/${getDBName(profile)}`;

  res = await fetchAs({ name: "db_creator_admin", roles: "_admin" }, url, {
    method: "PUT"
  });

  const securityDoc = {
    admins: { names: [], roles: [] },
    users: {
      names: [getProfileUsername(profile)],
      roles: [getProfileRole(profile)]
    }
  };

  const adminUser = { name: "db_creator_admin", roles: "_admin" };
  res = await fetchAs(adminUser, `${url}/_security`, {
    method: "PUT",
    body: JSON.stringify(securityDoc)
  });

  const adminDB = new PouchDB(url, {
    fetch(url, opts) {
      opts.headers = getFetchHeaders(adminUser);
      return PouchDB.fetch(url, opts);
    }
  });

  useDocumentModel(adminDB);
}
