import { Connection } from "typeorm";
import { Router } from "express";
import { ApiUser } from "../../entity";

import express = require("express");
import passport = require("passport");
import GoogleStrategy = require("passport-google-oauth20");

export function useGoogleProvider(db: Connection, parentRouter: Router) {
  if (!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)) {
    console.warn(
      "WARNING: The environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET have to be set in order for the server to handle the Google authentication provider."
    );
    return;
  }

  const router = express.Router();

  parentRouter.use("/google", router);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_BASE_URL}/auth/provider/google/callback`
      },
      async function(accessToken, refreshToken, profile, cb) {
        try {
          let apiUser = await db.manager.findOne(ApiUser, {
            provider: "google",
            id: profile.id
          });

          if (!apiUser) {
            apiUser = new ApiUser();
            apiUser.provider = "google";
            apiUser.id = profile.id;
          }

          apiUser.loggedEmail = null;
          apiUser.loggedName = profile.displayName;

          await db.manager.save(apiUser);

          return cb(null, {
            provider: profile.provider,
            id: profile.id,
            loggedName: profile.displayName
          });
        } catch (error) {
          console.error(error);
          cb(error);
        }
      }
    )
  );

  router.get("/", passport.authenticate("google", { scope: ["profile"] }));

  router.get(
    "/callback",
    passport.authenticate("google", { failureRedirect: "/accounts/login" }),
    function(req, res) {
      res.redirect("/");
    }
  );
}
