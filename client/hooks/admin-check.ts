import React from "react";
import Router from "next/router";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AdminCheckProps {
  successRedirect?: string;
  failureRedirect?: string;
}

export function useAdminCheck({
  successRedirect,
  failureRedirect
}: AdminCheckProps) {
  const { loading, error, data } = useQuery(gql`
    query IsAdminQuery {
      isAdmin
    }
  `);

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
}
