import * as R from "ramda";
import React from "react";
import Router from "next/router";
import { useDebounce } from "react-use";
import { useMutation } from "@apollo/react-hooks";
import { DocumentNode, OperationVariables, FetchResult } from "apollo-boost";

export interface FormStatus {
  success: boolean;
  inputErrors: {
    [key: string]: string[];
  };
}

export interface UseFormResults {
  submit: (event?: React.SyntheticEvent<HTMLFormElement>) => void;
  loading: boolean;
  form: { [key: string]: any };
  formStatus: FormStatus;
  setField: (key: string) => (event?: FieldEvent) => void;
}

type FieldEvent = React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>;

export interface UseFormOptions {
  successRedirect?: string;
  failureRedirect?: string;
  constants?: { [key: string]: any };
}

export function useForm(
  mutation: DocumentNode,
  options?: UseFormOptions
): UseFormResults {
  const [form, setForm] = React.useState({});

  const setField = key => event => {
    if (key && event) {
      setForm(R.assoc(key, event.target.value, form));
    }
  };

  const [mutate, { data: formStatus, loading }] = useMutation(mutation);

  const constants = (options && options.constants) || {};

  const submit = async event => {
    if (event) {
      event.preventDefault();
    }

    const result = await mutate({
      variables: { form: { ...constants, ...form } }
    });

    const formStatus = result && result.data[R.keys(result.data)[0]];

    if (formStatus && formStatus.success) {
      if (options && options.successRedirect) {
        Router.push(options.successRedirect);
      }

      return;
    }

    if (options && options.failureRedirect) {
      Router.push(options.failureRedirect);
    }
  };

  useDebounce(
    () => {
      mutate({
        variables: { form: { ...constants, ...form }, validate: true }
      });
    },
    1000,
    [form]
  );

  return { submit, loading, form, formStatus, setField };
}
