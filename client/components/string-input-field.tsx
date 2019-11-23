import React from "react";
import { Box, InputLabel, Input, Typography } from "@material-ui/core";
import ErrorList from "./error-list";
import { FormStatus } from "../hooks";

export interface StringInputFieldProps {
  formKey: string;
  label: string;
  form: { [key: string]: any };
  formStatus: FormStatus;
  setField: (
    key: string
  ) => (
    event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  password?: boolean;
}

const StringInputfield: React.FunctionComponent<StringInputFieldProps> = ({
  formKey,
  label,
  form,
  formStatus,
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
      <ErrorList
        errors={
          formStatus && formStatus.inputErrors[formKey]
            ? formStatus.inputErrors[formKey]
            : []
        }
      />
    </Box>
  );
};

export default StringInputfield;
