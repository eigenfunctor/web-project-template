import { Connection } from "typeorm";
import { Router } from "express";
import { useLocalProvider } from "./local";
import { useGoogleProvider } from "./google-oauth20";
import { createDocDatabase } from "../../couchdb-proxy";

import express = require("express");
import passport = require("passport");

export function useAuthProviderRoutes(db: Connection, parentRouter: Router) {
  const router = express.Router();

  parentRouter.use("/provider", router);

  passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
  });

  passport.deserializeUser(async function(json: string, done) {
    const profile = JSON.parse(json);

    await createDocDatabase(profile);

    done(null, profile);
  });

  useLocalProvider(db, router);

  // useGoogleProvider(db, router);

  // TODO: Add more providers here.
}
