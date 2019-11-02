import * as R from "ramda";
import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import preset from "@rebass/preset";

const theme = {};

const ThemeProvider: React.FunctionComponent = ({ children }) => {
  return (
    <EmotionThemeProvider theme={R.mergeDeepLeft(theme, preset)}>
      {children}
    </EmotionThemeProvider>
  );
};

export default ThemeProvider;
