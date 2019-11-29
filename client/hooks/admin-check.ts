import React from "react";
import Router from "next/router";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AdminCheckProps {
  successRedirect?: string;
  failureRedirect?: string;
}

// TODO use isAdmin with session change
export function useAdminCheck(props?: AdminCheckProps): boolean {
  const { successRedirect, failureRedirect } = props || {};

  const { loading, data } = useQuery(
    gql`
      query AdminCheckIsAdminQuery {
        isAdmin
      }
    `
  );

  React.useEffect(() => {
    if (loading) {
      return;
    }

    if (data && data.isAdmin) {
      if (successRedirect) {
        Router.push(successRedirect);
      }
    } else {
      if (failureRedirect) {
        Router.push(failureRedirect);
      }
    }
  }, [loading, data]);

  return !!(data && data.isAdmin);
}
