import { Connection } from "typeorm";
import { Application } from "express";
import { useAuthRouter } from "./auth";
import { useEchoRouter } from "./echo";

export default function useRouters(db: Connection, app: Application) {
  useAuthRouter(db, app);
  useEchoRouter(db, app);
}
