import * as R from "ramda";
import React from "react";
import Router, { useRouter } from "next/router";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  InputLabel,
  Input,
  Typography
} from "@material-ui/core";
import { useForm } from "../../../hooks";
import StringInputField from "../../../components/string-input-field";

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePasswordMutation(
    $form: PasswordResetForm!
    $validate: Boolean
  ) {
    changePassword(form: $form, validate: $validate) {
      success
      inputErrors {
        resetID
        password
      }
    }
  }
`;

const ChangePassword: React.FunctionComponent = () => {
  const { query } = useRouter();

  const { submit, loading, form, formStatus, setField } = useForm(
    CHANGE_PASSWORD_MUTATION,
    {
      successRedirect: "/accounts/login",
      constants: {
        resetID: query.id || "",
        password: "",
        confirmPassword: ""
      }
    }
  );

  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      <Box width={1} py={2}>
        <h2>Change Password</h2>
      </Box>
      <form onSubmit={submit}>
        <Grid container direction="column">
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
              Reset
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

export default ChangePassword;
