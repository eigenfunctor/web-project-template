import React from "react";
import { Box, Grid, Button, InputLabel, Input } from "@material-ui/core";
import { useAuthCheck } from "../hooks";

const Login: React.FunctionComponent = () => {
  useAuthCheck({ successRedirect: "/" });
  // TODO: render invalid credentials
  // TODO: render forgot password
  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      <form method="POST" action="/auth/local">
        <input
          type="hidden"
          id="successRedirect"
          name="successRedirect"
          value="/"
        />
        <input
          type="hidden"
          id="failureRedirect"
          name="failureRedirect"
          value="/login?failure=true"
        />
        <Grid container direction="column">
          <Box width={1} py={2}>
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input fullWidth id="email" name="email" />
          </Box>
          <Box width={1} py={2}>
            <InputLabel htmlFor="password">Password</InputLabel>
            <Input fullWidth type="password" id="password" name="password" />
          </Box>
          <Grid container direction="row-reverse">
            <Button variant="contained" color="primary" type="submit">
              Login
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default Login;
