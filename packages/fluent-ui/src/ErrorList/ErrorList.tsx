import React from "react";
import { MessageBar, MessageBarType } from "@fluentui/react";
import { Label } from "@fluentui/react";
import { ErrorListProps } from "@rjsf/core";
const styles = {
  root: [
    {
      fontSize: 24,
    },
  ],
};

const ErrorList = ({ errors }: ErrorListProps) => (
  <>
    {errors.map((error, i) => {
      return (
        <MessageBar
          key={i}
          messageBarType={MessageBarType.error}
          isMultiline={false}
          dismissButtonAriaLabel="Close">
          {error.stack}
        </MessageBar>
      );
    })}
  </>
);

export default ErrorList;
