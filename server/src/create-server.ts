import { Connection } from "typeorm";
import { useAuthRoutes } from "./auth";
import { useCouchDBProxy } from "./couchdb-proxy";
import createGraphqlServer from "./graphql";
import { updateRootAccount } from "./graphql/accounts/admin";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");

export async function createServer(
  db: Connection
): Promise<express.Application> {
  if (!process.env.COUCHDB_HOST || process.env.COUCHDB_HOST.length === 0) {
    console.warn("WARNING: COUCHDB_HOST environment variable is not set.");
  }

  await updateRootAccount(db);

  const app = express();
  app.use(
    session({
      // TODO: use a real secret
      secret: "dev secret",
      // TODO: use redis as a session store
      resave: false,
      saveUninitialized: false
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  useAuthRoutes(db, app);
  useCouchDBProxy(db, app);

  createGraphqlServer(db).applyMiddleware({ app });

  return app;
}
