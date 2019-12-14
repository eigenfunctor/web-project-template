import { Connection } from "typeorm";
import { Router } from "express";
import {
  getDocDBBaseURL,
  getDBName,
  getProfileUsername,
  getProfileRole,
  getProfileSecret
} from "./couchdb-util";

import express = require("express");
import proxy = require("http-proxy-middleware");

export function useCouchDBProxy(db: Connection, router: Router) {
  if (!process.env.COUCHDB_HOST || process.env.COUCHDB_HOST.length === 0) {
    console.warn("WARNING: COUCHDB_HOST environment variable is not set.");
    return;
  }

  router.use(
    "/couchdb",
    proxy({
      target: getDocDBBaseURL(),
      pathRewrite: (path, req) => {
        if (!(req.user && req.user.provider && req.user.id)) {
          // onProxyReq will reject this request but we return something regardless.
          return "/";
        }

        return path.replace(/^\/couchdb/, `/${getDBName(req.user)}`);
      },
      async onProxyReq(proxyReq, req, res) {
        if (!(req.user && req.user.provider && req.user.id)) {
          res.status(401);
          res.json({ error: "Unauthorized." });
          res.end();
          return;
        }

        proxyReq.setHeader(
          "x-auth-couchdb-username",
          getProfileUsername(req.user)
        );

        proxyReq.setHeader("x-auth-couchdb-roles", getProfileRole(req.user));

        const secret = getProfileSecret(req.user);

        if (secret) {
          proxyReq.setHeader("x-auth-couchdb-secret", secret);
        } else {
          proxyReq.removeHeader("x-auth-couchdb-secret");
        }
      }
    })
  );
}

export * from "./couchdb-util";
