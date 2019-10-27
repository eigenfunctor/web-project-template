import * as R from "ramda";
import React from "react";
import { ThemeProvider } from "emotion-theming";
import preset from "@rebass/preset";
import { Flex, Box } from "rebass";
import Nav from "./nav";
import AppHead from "./app-head";

const theme = {};

const Page: React.FunctionComponent = ({ children }) => {
  return (
    <ThemeProvider theme={R.mergeDeepLeft(theme, preset)}>
      <AppHead />
      <Nav />
      <Flex justifyContent="space-around">
        <Box maxWidth={1024} m="auto">
          {children}
        </Box>
      </Flex>
    </ThemeProvider>
  );
};

export default Page;
