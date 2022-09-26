import React from "react";
import { ErrorListProps } from "@rjsf/utils";
import { Message } from "semantic-ui-react";

/**
 *
 * @param errors
 * @returns {*}
 * @constructor
 */
function ErrorList({ errors }: ErrorListProps) {
  return (
    <Message negative>
      <Message.Header>Errors</Message.Header>
      <Message.List>
        {errors.map((error, index) => (
          <Message.Item key={`error-${index}`}>{error.stack}</Message.Item>
        ))}
      </Message.List>
    </Message>
  );
}

export default ErrorList;
