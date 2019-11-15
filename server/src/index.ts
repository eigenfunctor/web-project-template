import "reflect-metadata";
import { createConnection } from "typeorm";
import useRouters from "./routers";
import createGraphqlServer from "./graphql";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");

async function main() {
  try {
    const db = await createConnection();
    const app = express();
    const port = parseInt(process.env.API_SERVER_PORT) || 3001;

    if (typeof process.env.SET_ADMIN_OVERRIDE_CODE !== "undefined") {
      console.warn(
        `WARNING: The SET_ADMIN_OVERRIDE_CODE environment variable is set.`
      );
      console.warn(
        `WARNING: This means anyone can promote anyone to an admin using this code.`
      );
      console.warn(
        `WARNING: Unset SET_ADMIN_OVERRIDE_CODE to subdue this warning.`
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

    useRouters(db, app);

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
