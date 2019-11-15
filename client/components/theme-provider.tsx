import * as R from "ramda";
import React from "react";
import {
  createMuiTheme,
  ThemeProvider as MUIThemeProvider
} from "@material-ui/core/styles";

export const theme = createMuiTheme({
  // TODO: Customize theme here
});

const ThemeProvider: React.FunctionComponent = ({ children }) => {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
};

export default ThemeProvider;
