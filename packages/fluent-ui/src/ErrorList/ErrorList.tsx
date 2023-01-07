import React from "react";
import { MessageBar, MessageBarType } from "@fluentui/react";
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors }: ErrorListProps<T, S, F>) {
  return (
    <>
      {errors.map((error, i) => {
        return (
          <MessageBar
            key={i}
            messageBarType={MessageBarType.error}
            isMultiline={false}
            dismissButtonAriaLabel="Close"
          >
            {error.stack}
          </MessageBar>
        );
      })}
    </>
  );
}
