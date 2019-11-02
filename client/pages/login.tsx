import React from "react";
import { Box, Flex, Button } from "rebass";
import { Label, Input } from "@rebass/forms";

const Login: React.FunctionComponent = () => {
  return (
    <Box as="form" method="POST" action="/auth/local" py={3}>
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
      <Flex
        flexDirection="column"
        mx="auto"
        maxWidth={512}
        sx={{ px: 3, py: 5 }}
      >
        <Box width={1} sx={{ py: 2 }}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" />
        </Box>
        <Box width={1} sx={{ py: 2 }}>
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" name="password" />
        </Box>
        <Flex flexDirection="row-reverse" sx={{ py: 2 }}>
          <Button type="submit">Login</Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Login;
