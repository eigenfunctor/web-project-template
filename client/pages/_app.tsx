import React from "react";
import NextApp from "next/app";
import Head from "next/head";
import "isomorphic-fetch";

import Nav from "../components/nav";
import ThemeProvider from "../components/theme-provider";
import ApolloProvider from "../components/apollo-provider";

class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <ApolloProvider>
        <ThemeProvider>
          <Head>
            <title>Web Project Template</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Nav />
          <Component {...pageProps} />
        </ThemeProvider>
      </ApolloProvider>
    );
  }
}
export default App;
