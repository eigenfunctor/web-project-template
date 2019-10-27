import React from "react";
import { Box, Flex, Button } from "rebass";
import { Label, Input, Select, Textarea, Radio, Checkbox } from "@rebass/forms";
import Page from "../../components/page";

const Login: React.FunctionComponent = () => {
  return (
    <Page>
      <Box as="form" onSubmit={e => e.preventDefault()} py={3}>
        <Flex>
          <Box width={1} px={2}>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue="Jane Doe" />
          </Box>
          <Box width={1} px={2}>
            <Label htmlFor="location">Location</Label>
            <Select id="location" name="location" defaultValue="NYC">
              <option>NYC</option>
              <option>DC</option>
              <option>ATX</option>
              <option>SF</option>
              <option>LA</option>
            </Select>
          </Box>
        </Flex>
      </Box>
    </Page>
  );
};

export default Login;
