import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  InputLabel,
  Input
} from "@material-ui/core";
import { useAuthCheck } from "../hooks";

const Login: React.FunctionComponent = () => {
  useAuthCheck({ successRedirect: "/" });

  const { query } = useRouter();

  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      {query.failure && (
        <Box component={Card}>
          <Box component={CardContent}>
            <Grid container justify="center">
              <h3>Invalid Credentials.</h3>
            </Grid>
          </Box>
        </Box>
      )}
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
          <Grid container direction="row-reverse" justify="space-between">
            <Button variant="contained" color="primary" type="submit">
              Login
            </Button>
            <Box>
              <Box>
                <Link href="/password/send-reset">
                  <a>Forgot password.</a>
                </Link>
              </Box>
              <Box py={[1]}>
                <Link href="/verification/resend">
                  <a>Resend verification email.</a>
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default Login;
