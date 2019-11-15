import React from "react";
import NextApp from "next/app";
import Head from "next/head";
import { CssBaseline, Paper } from "@material-ui/core";
import "isomorphic-fetch";

import Nav from "../components/nav";
import ThemeProvider from "../components/theme-provider";
import ApolloProvider from "../components/apollo-provider";

class App extends NextApp {
  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement!.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <ApolloProvider>
        <Head>
          <title>Web Project Template</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <ThemeProvider>
          <CssBaseline />
          <Nav />
          <Component {...pageProps} />
        </ThemeProvider>
      </ApolloProvider>
    );
  }
}
export default App;
