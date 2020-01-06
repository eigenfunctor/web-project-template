import { Connection } from "typeorm";
import useAuthRoutes from "./auth";
import createGraphqlServer from "./graphql";
import { updateRootAccount } from "./graphql/accounts/admin";

import express = require("express");
import session = require("express-session");
import bodyParser = require("body-parser");
import passport = require("passport");
import redis = require("redis");
import withRedisStore = require("connect-redis");

const RedisStore = withRedisStore(session);

export async function createServer(
  db: Connection
): Promise<express.Application> {
  await updateRootAccount(db);

  const app = express();

  let secret = process.env.SESSION_SECRET;
  if (!(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length > 0)) {
    console.warn(
      "WARNING: The SESSION_SECRET environment variable is not set."
    );

    secret = "default-session-secret";
  }

  let store;
  if (process.env.REDIS_URL && process.env.REDIS_URL.length > 0) {
    const redisClient = redis.createClient(process.env.REDIS_URL);

    store = new RedisStore({ client: redisClient });
  }

  app.use(
    session({
      store,
      secret,
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
