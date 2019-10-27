import { Connection } from "typeorm";
import { Application } from "express";
import { ApiUser } from "../entity";
import { useJWTParser } from "./middleware";

import bcrypt = require("bcrypt");
import express = require("express");

export function useEchoRouter(db: Connection, app: Application) {
  const router = express.Router();

  app.use("/echo", router);

  useJWTParser(db, router);

  // TODO: return user details
  router.post("/", async (req, res) => {});
}
