import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { createServer } from "../../src/create-server";
import { Application } from "express";

import uuid = require("uuid/v4");
import ormconfig = require("../../ormconfig");

interface Refs {
  app?: Application;
  db?: Connection;
}

export function testSetup(): Refs {
  const refs: Refs = {};

  const id = uuid();

  const database = `${process.env.DB_NAME}--test--${id}`;

  beforeAll(async () => {
    const tempDB = await createConnection(ormconfig);
    await tempDB.query(`DROP DATABASE IF EXISTS "${database}"`);
    await tempDB.query(`CREATE DATABASE "${database}"`);
    await tempDB.close();

    refs.db = await createConnection({ ...ormconfig, database, name: id });
    refs.app = await createServer(refs.db);
  });

  afterAll(async () => {
    await refs.db.close();

    const tempDB = await createConnection(ormconfig);
    await tempDB.query(`DROP DATABASE IF EXISTS "${database}"`);
    await tempDB.close();
  });

  return refs;
}
