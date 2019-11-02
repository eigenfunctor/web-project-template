import { Connection } from "typeorm";
import { Router } from "express";
import { useAuthRoutes } from "./provider";

export default function useRoutes(db: Connection, parentRouter: Router) {
  useAuthRoutes(db, parentRouter);
}
