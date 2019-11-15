import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider as BaseApolloProvider } from "@apollo/react-hooks";

const ApolloProvider: React.FunctionComponent = ({ children }) => {
  let uri = "/graphql";

  // Use APP_PROXY_URI as the base URL during server side rendering.
  if (typeof window === "undefined") {
    if (process.env.APP_PROXY_URI) {
      uri = `${process.env.APP_PROXY_URI}${uri}`;
    } else {
      console.warn("WARNING: APP_PROXY_URI environment variable not set.");
    }
  }

  const client = new ApolloClient({ uri });

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
};

export default ApolloProvider;
