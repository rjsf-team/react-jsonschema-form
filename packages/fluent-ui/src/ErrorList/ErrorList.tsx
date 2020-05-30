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
    <Label styles={styles}>Errors</Label>
    {errors.map(error => {
      return (
        //   <div id="container">
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          dismissButtonAriaLabel="Close">
          {error.stack}
        </MessageBar>
        //     </div>
      );
    })}
  </>
);

export default ErrorList;
