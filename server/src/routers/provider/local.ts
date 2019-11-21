import { Connection } from "typeorm";
import { Router } from "express";
import { ApiUser, LocalUser } from "../../entity";

import argon2 = require("argon2");
import express = require("express");
import passport = require("passport");
import LocalStrategy = require("passport-local");

export function useLocalProvider(db: Connection, parentrouter: Router) {
  const router = express.Router();

  parentrouter.use("/local", router);

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async function(email, password, done) {
        // Fail if the user is trying to access the root account while ENABLE_ROOT_ACCOUNT is not set to "1".
        if (email === "root" && process.env.ENABLE_ROOT_ACCOUNT !== "1") {
          console.warn(`WARNING: Unauthorized login attempt to root account.`);
          return done(null, false);
        }

        const user = await db.manager.findOne(LocalUser, { email });

        // Fail if user does not exist or password hash is not populated.
        if (!user || !user.passwordHash) {
          return done(null, false);
        }

        // Fail if password verification fails.
        if (!(await argon2.verify(user.passwordHash, password))) {
          return done(null, false);
        }

        let apiUser = await db.manager.findOne(ApiUser, {
          provider: "local",
          id: user.id
        });

        if (!apiUser) {
          apiUser = new ApiUser();
          apiUser.provider = "local";
          apiUser.id = user.id;
        }

        apiUser.loggedName = user.fullName;
        apiUser.loggedEmail = user.email;

        await db.manager.save(apiUser);

        return done(null, {
          provider: apiUser.provider,
          id: apiUser.id,
          loggedName: apiUser.loggedName,
          loggedEmail: apiUser.loggedEmail
        });
      }
    )
  );

  router.post("/", (req, res, next) => {
    if (!req.body.successRedirect) {
      res.status(422);
      res.json({
        error: `${req.body.successRedirect} is not a valid successRedirect value.`
      });
      return;
    }

    if (!req.body.failureRedirect) {
      res.status(422);
      res.json({
        error: `${req.body.failureRedirect} is not a valid failureRedirect value.`
      });
      return;
    }

    const handler = passport.authenticate("local", {
      successRedirect: req.body.successRedirect,
      failureRedirect: req.body.failureRedirect
    });

    handler(req, res, next);
  });
}
