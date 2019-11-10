import "reflect-metadata";
import { createConnection } from "typeorm";
import useRouters from "./routers";
import createGraphqlServer from "./graphql";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");

import { LocalUser } from "./entity/local-user";
import { TableFilter, buildTableQuery } from "./graphql/table";

async function main() {
  try {
    const db = await createConnection();
    const app = express();
    const port = parseInt(process.env.API_SERVER_PORT) || 3001;

    const qb = db.manager.createQueryBuilder(LocalUser, "user");

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
