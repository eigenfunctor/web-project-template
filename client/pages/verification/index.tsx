import React from "react";
import Router, { useRouter } from "next/router";
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

const VERIFY_ACCOUNT_MUTATION = gql`
  mutation VerifyAccountMutation($verificationID: String!) {
    verifyAccount(verificationID: $verificationID) {
      success
      inputErrors {
        verificationID
      }
    }
  }
`;

const Verification: React.FunctionComponent = () => {
  const { query } = useRouter();

  const [email, setEmail] = React.useState();

  const [mutate, { data, loading }] = useMutation(VERIFY_ACCOUNT_MUTATION);

  React.useEffect(() => {
    if (query.id) {
      mutate({ variables: { verificationID: query.id || "" } });
    }
  }, [query.id]);

  React.useEffect(() => {
    if (data && data.verifyAccount && data.verifyAccount.success) {
      Router.push("/login");
    }
  }, [data && data.verifyAccount]);

  if (loading) {
    return (
      <Grid container justify="center">
        <Box py={3} mx="auto" my={100} maxWidth={512} px={3}>
          <Box width={1} py={2}>
            <h2>Verifying your email address...</h2>
          </Box>
        </Box>
      </Grid>
    );
  }

  if (data) {
    return (
      <Grid container justify="center">
        <Box py={3} mx="auto" my={100} maxWidth={512} px={3}>
          <Box width={1} py={2}>
            <ul style={{ listStyleType: "none" }}>
              {data.verifyAccount.inputErrors.verificationID.map(e => (
                <li>
                  <h4>{e}</h4>
                </li>
              ))}
            </ul>
          </Box>
        </Box>
      </Grid>
    );
  }

  return null;
};

export default Verification;
