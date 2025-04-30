import React from 'react';
import { HelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Alert } from '@trussworks/react-uswds';

/** The `HelpTemplate` component renders the help text for a field as a USWDS Slim Alert
 *
 * @param props - The `HelpProps` for the component
 */
export default function HelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: HelpProps<T, S, F>) {
  const { id, help } = props;
  if (!help) {
    return null;
  }
  return (
    <Alert id={id} type="info" slim={true} role="tooltip" className="margin-top-1"> {/* Add margin-top for spacing below the field */}
      {help}
    </Alert>
  );
}
