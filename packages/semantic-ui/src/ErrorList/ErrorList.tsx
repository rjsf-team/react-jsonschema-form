import React from "react";
import { Message } from "semantic-ui-react";
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors }: ErrorListProps<T, S, F>) {
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
