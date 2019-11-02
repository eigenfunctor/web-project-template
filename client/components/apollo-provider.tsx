import React from "react";
import ApolloClient from "apollo-boost";
import { ApolloProvider as BaseApolloProvider } from "@apollo/react-hooks";

const ApolloProvider: React.FunctionComponent = ({ children }) => {
  const client = new ApolloClient({
    uri: "/graphql"
  });

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
};

export default ApolloProvider;
