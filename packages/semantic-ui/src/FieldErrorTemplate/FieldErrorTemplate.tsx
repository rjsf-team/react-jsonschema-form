import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { nanoid } from 'nanoid';
import { Label, List } from 'semantic-ui-react';

import { getSemanticErrorProps } from '../util';

const DEFAULT_OPTIONS = {
  options: {
    pointing: 'above',
    size: 'small',
  },
};

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors, idSchema, uiSchema, registry }: FieldErrorProps<T, S, F>) {
  const { formContext } = registry;
  const options = getSemanticErrorProps<T, S, F>({
    formContext,
    uiSchema,
    defaultProps: DEFAULT_OPTIONS,
  });
  const { pointing, size } = options;
  if (errors && errors.length > 0) {
    const id = errorId<T>(idSchema);
    return (
      <Label id={id} color='red' pointing={pointing || 'above'} size={size || 'small'} basic>
        <List bulleted>
          {errors.map((error) => (
            <List.Item key={nanoid()}>{error}</List.Item>
          ))}
        </List>
      </Label>
    );
  }
  return null;
}
