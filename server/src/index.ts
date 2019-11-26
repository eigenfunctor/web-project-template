import "reflect-metadata";
import { createConnection } from "typeorm";
import { createServer } from "./create-server";

async function main() {
  try {
    const db = await createConnection();
    const port = parseInt(process.env.API_SERVER_PORT) || 3001;

    const app = await createServer(db);

    app.listen(port, () => console.log(`API listening on port ${port}!`));
  } catch (error) {
    console.log("Failed with:");
    console.log(error);

    const timeout = parseInt(process.env.FAILURE_RETRY_TIMEOUT) || 10;

    console.log(`Retrying in ${timeout}s...`);

    setTimeout(main, timeout * 1000);
  }
}

main();
