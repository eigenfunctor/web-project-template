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

  passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
  });

  passport.deserializeUser(function(json: string, done) {
    done(null, JSON.parse(json));
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async function(email, password, done) {
        const user = await db.manager.findOne(LocalUser, { email });

        // Fail if user does not exist or password hash is not populated.
        if (!user || !user.passwordHash) {
          done(null, false);
          return;
        }

        // Fail if password verification fails.
        if (!(await argon2.verify(user.passwordHash, password))) {
          done(null, false);
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

        done(null, {
          provider: apiUser.provider,
          id: apiUser.id,
          name: apiUser.loggedName,
          email: apiUser.loggedEmail
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
