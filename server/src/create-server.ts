import { Connection } from "typeorm";
import useAuthRoutes from "./auth";
import createGraphqlServer from "./graphql";
import { updateRootAccount } from "./graphql/accounts/local-account";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");

export async function createServer(
  db: Connection
): Promise<express.Application> {
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

  createGraphqlServer(db).applyMiddleware({ app });

  return app;
}
