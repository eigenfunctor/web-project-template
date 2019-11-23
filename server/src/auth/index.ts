import { Connection } from "typeorm";
import { Router } from "express";
import { useAuthProviderRoutes } from "./provider";

import express = require("express");

export default function useAuthRoutes(db: Connection, parentRouter: Router) {
  const router = express.Router();

  parentRouter.use("/auth", router);

  useAuthProviderRoutes(db, router);

  router.get("/logout", async (req, res) => {
    req.logout();
    res.redirect("/");
  });
}
