import { Connection } from "typeorm";
import { Router } from "express";
import { useLocalProvider } from "./local";
import { useGoogleProvider } from "./google-oauth20";

import express = require("express");
import passport = require("passport");

export function useAuthProviderRoutes(db: Connection, parentRouter: Router) {
  const router = express.Router();

  parentRouter.use("/provider", router);

  passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
  });

  passport.deserializeUser(function(json: string, done) {
    done(null, JSON.parse(json));
  });

  useLocalProvider(db, router);

  // useGoogleProvider(db, router);

  // TODO: Add more providers here.
}
