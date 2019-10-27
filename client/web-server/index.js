const express = require("express");
const next = require("next");

const useAuth = require("./auth");
const useProxy = require("./proxy");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    // useAuth(server);
    // useProxy(server);

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(parseInt(process.env.WEB_SERVER_PORT) || 3000, err => {
      if (err) throw err;
      console.log("> Ready on http://localhost:3000");
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });
