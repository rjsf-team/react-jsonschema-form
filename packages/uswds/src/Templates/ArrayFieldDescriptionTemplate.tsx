import React from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ArrayFieldDescriptionProps,
} from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders the description for an array field
 *
 * @param props - The `ArrayFieldDescriptionProps` for this component
 */
export default function ArrayFieldDescriptionTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ description, id }: ArrayFieldDescriptionProps<T, S, F>) {
  if (!description) {
    return null;
  }

  return (
    <div id={id} className="field-description">
      {description}
    </div>
  );
}
