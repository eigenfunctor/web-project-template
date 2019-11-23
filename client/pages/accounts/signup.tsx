import * as R from "ramda";
import React from "react";
import Router from "next/router";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Input,
  InputLabel,
  Typography
} from "@material-ui/core";
import { useForm, useAuthCheck } from "../../hooks";
import StringInputField from "../../components/string-input-field";

const SIGNUP_MUTATION = gql`
  mutation SignupMutation($form: SignupForm!, $validate: Boolean) {
    signup(form: $form, validate: $validate) {
      success
      inputErrors {
        email
        password
      }
    }
  }
`;

const Signup: React.FunctionComponent = () => {
  useAuthCheck({ successRedirect: "/" });

  const { submit, loading, form, formStatus, setField } = useForm(
    SIGNUP_MUTATION,
    {
      successRedirect: "/accounts/login",
      constants: {
        email: "",
        fullName: "",
        password: "",
        confirmPassword: ""
      }
    }
  );

  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      <Box width={1} py={2}>
        <h2>Signup</h2>
      </Box>
      <form onSubmit={submit}>
        <Grid container direction="column">
          <StringInputField
            formKey={"email"}
            label="Email"
            {...{ form, formStatus, setField }}
          />
          <StringInputField
            formKey={"fullName"}
            label="Full Name"
            {...{ form, formStatus, setField }}
          />
          <StringInputField
            password
            formKey={"password"}
            label="Password"
            {...{ form, formStatus, setField }}
          />
          <StringInputField
            password
            formKey={"confirmPassword"}
            label="Confirm Password"
            {...{ form, formStatus, setField }}
          />
          <Grid container direction="row-reverse">
            <Button variant="contained" color="primary" type="submit">
              Sign up
            </Button>
          </Grid>
        </Grid>
      </form>
      <Card style={{ visibility: loading ? "visible" : "hidden" }}>
        <CardContent>
          <h3>Loading...</h3>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Signup;
