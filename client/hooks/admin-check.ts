import React from "react";
import { useDebounce } from "react-use";
import Router, { useRouter } from "next/router";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

interface AdminCheckProps {
  successRedirect?: string;
  failureRedirect?: string;
}

export function useAdminCheck(props?: AdminCheckProps): boolean {
  const { successRedirect, failureRedirect } = props || {};

  const { query } = useRouter();

  const { data: profileData } = useQuery(gql`
    query ProfileQuery {
      profile {
        id
        provider
      }
    }
  `);

  const { data: isAdminData } = useQuery(
    gql`
      query AdminCheckIsAdminQuery($profile: ProfileInput!) {
        isAdmin(profile: $profile)
      }
    `,
    {
      skip: !(profileData && profileData.profile),
      variables: {
        profile: profileData &&
          profileData.profile && {
            provider: profileData.profile.provider,
            id: profileData.profile.id
          }
      }
    }
  );

  useDebounce(
    () => {
      if (query.override || (isAdminData && isAdminData.isAdmin)) {
        if (successRedirect) {
          Router.push(successRedirect);
        }
      } else {
        if (failureRedirect) {
          Router.push(failureRedirect);
        }
      }
    },
    1000,
    [query.override, isAdminData]
  );

  return !!query.override || !!(isAdminData && isAdminData.isAdmin);
}
