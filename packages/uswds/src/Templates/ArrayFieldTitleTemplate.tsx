import React from 'react';
import { ArrayFieldTitleProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders the title for an array field
 *
 * @param props - The `ArrayFieldTitleProps` for this component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, title, required }: ArrayFieldTitleProps<T, S, F>) {
  if (!title) {
    return null;
  }

  return (
    <legend id={id}>
      {title}
      {required && <span className="required">*</span>}
    </legend>
  );
}
