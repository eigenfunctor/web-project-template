import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { Application } from "express";
import { createServer } from "../../src/create-server";
import { ApiUser } from "../../src/entity";
import {
  getDocDBBaseURL,
  getDBName,
  getProfileUsername,
  getProfileRole,
  getProfileSecret,
  fetchAs
} from "../../src/couchdb-proxy";

import crypto = require("crypto");
import uuid = require("uuid/v4");
import ormconfig = require("../../ormconfig");

export interface AppRefs {
  app?: Application;
  db?: Connection;
}

const DOC_DB_PREFIX = "testing";

export function appSetup(): AppRefs {
  const refs: AppRefs = {};

  const id = uuid();

  const database = `${process.env.DB_NAME}--test--${id}`;

  beforeAll(async () => {
    process.env.DOC_DATABASE_NAME_PREFIX = DOC_DB_PREFIX;

    await destroyDocDBs();

    const tempDB = await createConnection({ ...ormconfig, cache: false });
    await tempDB.query(`DROP DATABASE IF EXISTS "${database}"`);
    await tempDB.query(`CREATE DATABASE "${database}"`);
    await tempDB.close();

    refs.db = await createConnection({
      ...ormconfig,
      cache: false,
      database,
      name: id
    });

    refs.app = await createServer(refs.db);
  });

  afterAll(async () => {
    await refs.db.close();

    const tempDB = await createConnection(ormconfig);
    await tempDB.query(`DROP DATABASE IF EXISTS "${database}"`);
    await tempDB.close();

    await destroyDocDBs();
  });

  return refs;
}

async function destroyDocDBs() {
  const url = `${getDocDBBaseURL()}/_all_dbs`;

  const dbNames = await fetchAs(
    { name: "db_test_teardown_admin", roles: "_admin" },
    url
  ).then(res => res.json());

  await Promise.all(
    dbNames
      .filter(name => name.startsWith(DOC_DB_PREFIX))
      .map(async name => {
        return fetchAs(
          { name: "db_test_teardown_admin", roles: "_admin" },
          `${getDocDBBaseURL()}/${name}`,
          {
            method: "DELETE"
          }
        );
      })
  );
}
