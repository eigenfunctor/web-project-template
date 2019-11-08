import { Connection } from "typeorm";
import { Router } from "express";
import { useLocalProvider } from "./local";

import express = require("express");

export function useAuthRoutes(db: Connection, parentRouter: Router) {
  const router = express.Router();

  parentRouter.use("/auth", router);

  useLocalProvider(db, router);

  router.get("/logout", async (req, res) => {
    req.logout();
    res.redirect("/");
  });
}
