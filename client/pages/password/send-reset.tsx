import React from "react";
import Router from "next/router";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import {
  Box,
  Grid,
  Button,
  InputLabel,
  Input,
  Typography
} from "@material-ui/core";

const PASSWORD_RESET_MUTATION = gql`
  mutation SendPasswordResetMutation($email: String!) {
    sendPasswordReset(email: $email)
  }
`;

const PasswordReset: React.FunctionComponent = () => {
  const [email, setEmail] = React.useState("");

  const [mutate] = useMutation(PASSWORD_RESET_MUTATION);

  const submit = async event => {
    event.preventDefault();

    await mutate({ variables: { email } });

    Router.push("/password/send-reset?sent=true");
  };

  // TODO: render sent message.

  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      <Box width={1} py={2}>
        <h2>Password Reset</h2>
        <Typography>
          Please enter the email you registered with to recieve a password reset
          link.
        </Typography>
      </Box>
      <form onSubmit={submit}>
        <Grid container direction="column">
          <Box width={1} py={2}>
            <InputLabel htmlFor="email">Email</InputLabel>
            <Input
              fullWidth
              id="email"
              name="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </Box>
          <Grid container direction="row-reverse">
            <Button variant="contained" color="primary" type="submit">
              Send Reset Link
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default PasswordReset;
