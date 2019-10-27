import { Connection } from "typeorm";
import { Application } from "express";
import { LocalUser } from "../entity";

import bcrypt = require("bcrypt");
import express = require("express");

export function useAuthRouter(db: Connection, app: Application) {
  const router = express.Router();

  app.use("/auth", router);

  router.post("/login", async (req, res) => {
    function fail() {
      res.status(403);
      res.render("error", { error: "Invalid credentials." });
    }
    const user = await db.manager.findOne(LocalUser, {
      email: req.body.email
    });

    if (!user) {
      fail();
      return;
    }

    const passwordComparison = await bcrypt.compare(
      req.body.password,
      user.passwordHash
    );

    if (!passwordComparison) {
      fail();
      return;
    }

    res.json({ id: user.id, emails: [user.email] });
  });

  router.post("/signup", async (req, res) => {
    const user = new LocalUser();

    user.email = req.body.email;
    user.passwordHash = await bcrypt.hash(req.body.password, 10);

    await db.manager.save(user);

    // TODO: send verification email

    res.json({ success: true });
  });

  // TODO: add verification
  router.post("/verify", async (req, res) => {
    // TODO: if req.body.id given then validate against DB
    // TODO: if req.body.resend given then send new verification to the value as email if it exists as localuser
    res.json({ success: true });
  });

  // TODO: add verification check
  router.post("/check-verified", async (req, res) => {
    // TODO: check if if req.body.id maps to a localuser with a verified email verification entry.
    res.json({ success: true });
  });

  // TODO: add password reset.
  router.post("/reset", async (req, res) => {
    // TODO: send password reset email if req.body.email maps to a localuser.
    res.json({ success: true });
  });
}
