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
  setField: (key: string) => (eventOrValue?: FieldEvent) => void;
}

// This type is just to make it clear that the
// setField eventOrValue argument has special treatment if it is an event.
type FieldEvent =
  | React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  | any;

export interface UseFormOptions {
  successRedirect?: string;
  failureRedirect?: string;
  constants?: { [key: string]: any };
}

const FORM_DEBOUNCE_TIME_MS = 500;

export function useForm(
  mutation: DocumentNode,
  options?: UseFormOptions
): UseFormResults {
  const [form, setForm] = React.useState({});

  const setField = key => eventOrValue => {
    if (key && eventOrValue) {
      setForm(
        R.assoc(
          key,
          eventOrValue.target ? eventOrValue.target.value : eventOrValue,
          form
        )
      );
    }
  };

  const [mutate, { data, loading }] = useMutation(mutation);

  const formStatus = data && data[R.keys(data)[0]];

  const constants = (options && options.constants) || {};

  const submit = async event => {
    if (event) {
      event.preventDefault();
    }

    const result = await mutate({
      variables: { form: { ...constants, ...form } }
    });

    const formStatus = result.data && result.data[R.keys(result.data)[0]];

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
    FORM_DEBOUNCE_TIME_MS,
    [form]
  );

  return { submit, loading, form, formStatus, setField };
}
