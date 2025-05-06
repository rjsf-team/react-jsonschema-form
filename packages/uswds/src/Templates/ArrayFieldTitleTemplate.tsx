import React from 'react';
import {
  ArrayFieldTitleProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders a title for an array field
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ idSchema, title, required }: ArrayFieldTitleProps<T, S, F>) {
  if (!title) {
    return null;
  }
  const id = titleId<T>(idSchema);
  return (
    <legend id={id} className="field-title">
      {title}
      {required && <span className="required">*</span>}
    </legend>
  );
}
