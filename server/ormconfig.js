const path = require("path");

module.exports = {
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [path.join(__dirname, "src/entity/**/*.ts")],
  migrations: [path.join(__dirname, "src/migration/**/*.ts")],
  subscribers: [path.join(__dirname, "src/subscriber/**/*.ts")],
  cache: true,
  cli: {
    entitiesDir: path.join(__dirname, "src/entity"),
    migrationsDir: path.join(__dirname, "src/migration"),
    subscribersDir: path.join(__dirname, "src/subscriber")
  },
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
