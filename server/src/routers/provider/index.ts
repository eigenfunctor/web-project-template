import { Connection } from "typeorm";
import { Router } from "express";
import { useLocalProvider } from "./local";

import express = require("express");
import passport = require("passport");

export function useAuthRoutes(db: Connection, parentRouter: Router) {
  const router = express.Router();

  passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
  });

  passport.deserializeUser(function(json: string, done) {
    done(null, JSON.parse(json));
  });

  parentRouter.use("/auth", router);

  useLocalProvider(db, router);

  router.get("/logout", async (req, res) => {
    req.logout();
    res.redirect("/");
  });
}
