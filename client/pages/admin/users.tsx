import React from "react";
import { useAuthCheck } from "../../hooks";

const Users: React.FunctionComponent = () => {
  useAuthCheck({ failureRedirect: "/login" });
  return null;
};

export default Users;
