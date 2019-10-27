import "reflect-metadata";
import { createConnection } from "typeorm";
import useRouters from "./routers";

import express = require("express");
import bodyParser = require("body-parser");

async function main() {
  try {
    const db = await createConnection();
    const app = express();
    const port = parseInt(process.env.API_SERVER_PORT) || 3001;

    app.use(bodyParser.json());

    // useRouters(db, app);

    app.listen(port, () => console.log(`API listening on port ${port}!`));
  } catch (error) {
    console.log(error);
    console.log("Retrying in 10 seconds...");
    setTimeout(main, parseInt(process.env.DB_RETRY_TIMEOUT) || 10000);
  }
}

main();
