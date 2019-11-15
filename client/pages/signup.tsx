import * as R from "ramda";
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
import { useForm, useAuthCheck } from "../hooks";

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
      successRedirect: "/login",
      constants: {
        email: "",
        fullName: "",
        password: "",
        confirmPassword: ""
      }
    }
  );

  // TODO: Show errors
  // TODO: Show loading

  return (
    <Box py={3} mx="auto" maxWidth={512} px={3}>
      <Box width={1} py={2}>
        <h2>Signup</h2>
      </Box>
      <form onSubmit={submit}>
        <Grid container direction="column">
          <InputField formKey={"email"} label="Email" {...{ form, setField }} />
          <InputField
            formKey={"fullName"}
            label="Full Name"
            {...{ form, setField }}
          />
          <InputField
            password
            formKey={"password"}
            label="Password"
            {...{ form, setField }}
          />
          <InputField
            password
            formKey={"confirmPassword"}
            label="Confirm Password"
            {...{ form, setField }}
          />
          <Grid container direction="row-reverse">
            <Button variant="contained" color="primary" type="submit">
              Sign up
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default Signup;

interface InputFieldProps {
  formKey: string;
  label: string;
  form: { [key: string]: any };
  setField: (
    key: string
  ) => (
    event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  password?: boolean;
}

const InputField: React.FunctionComponent<InputFieldProps> = ({
  formKey,
  label,
  form,
  setField,
  password
}) => {
  return (
    <Box width={1} py={2}>
      <InputLabel htmlFor={`${formKey}--inputfield`}>{label}</InputLabel>
      <Input
        fullWidth
        type={password && "password"}
        id={`${formKey}--inputfield`}
        name={formKey}
        value={form[formKey] || ""}
        onChange={setField(formKey)}
      />
    </Box>
  );
};
