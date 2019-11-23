import "reflect-metadata";
import { createConnection } from "typeorm";
import useAuthRoutes from "./auth";
import createGraphqlServer from "./graphql";
import { updateRootAccount } from "./graphql/accounts/local-account";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");

async function main() {
  try {
    const db = await createConnection();
    const app = express();
    const port = parseInt(process.env.API_SERVER_PORT) || 3001;

    await updateRootAccount(db);

    if (process.env.ENABLE_ROOT_ACCOUNT === "1") {
      console.warn(
        `WARNING: The ENABLE_ROOT_ACCOUNT environment variable is set.`
      );
      console.warn(
        `WARNING: This means anyone can login to an administrator account using the password set by the ROOT_PASSWORD environment variable or "root" by default.`
      );
      console.warn(
        `WARNING: Unset ENABLE_ROOT_ACCOUNT to subdue this warning.`
      );
    }

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

    app.listen(port, () => console.log(`API listening on port ${port}!`));
  } catch (error) {
    console.log("Failed with:");
    console.log(error);

    const timeout = parseInt(process.env.FAILURE_RETRY_TIMEOUT) || 10;

    console.log(`Retrying in ${timeout}s...`);

    setTimeout(main, timeout * 1000);
  }
}

main();
