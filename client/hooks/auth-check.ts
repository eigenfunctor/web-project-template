import React from "react";
import Router from "next/router";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AuthCheckProps {
  successRedirect?: string;
  failureRedirect?: string;
}

export function useAuthCheck(props?: AuthCheckProps) {
  const { successRedirect, failureRedirect } = props || {};

  const { loading, data } = useQuery(gql`
    query ProfileQuery {
      profile {
        provider
        id
        loggedEmail
        loggedName
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

  return data && data.profile;
}
