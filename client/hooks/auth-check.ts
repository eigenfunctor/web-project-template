import React from "react";
import Router from "next/router";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AuthCheckProps {
  successRedirect?: string;
  failureRedirect?: string;
}

export function useAuthCheck({
  successRedirect,
  failureRedirect
}: AuthCheckProps) {
  const { loading, error, data } = useQuery(gql`
    query getProfile {
      profile {
        id
      }
    }
  `);

  React.useEffect(() => {
    if (loading) {
      return;
    }

    if (data && data.profile) {
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
