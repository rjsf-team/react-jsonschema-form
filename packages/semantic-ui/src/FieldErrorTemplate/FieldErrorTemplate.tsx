import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';
import { Label, List } from 'semantic-ui-react';

import { getSemanticErrorProps } from '../util.tsx';

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
  F extends FormContextType = any,
>({ errors, fieldPathId, uiSchema, registry }: FieldErrorProps<T, S, F>) {
  const { formContext } = registry;
  const options = getSemanticErrorProps<T, S, F>({
    formContext,
    uiSchema,
    defaultProps: DEFAULT_OPTIONS,
  });
  const { pointing, size } = options;
  if (errors && errors.length > 0) {
    const id = errorId(fieldPathId);
    return (
      <Label id={id} color='red' pointing={pointing || 'above'} size={size || 'small'} basic>
        <List bulleted>
          {errors.map((error, i: number) => (
            // oxlint-disable-next-line react/no-array-index-key
            <List.Item key={i}>{error}</List.Item>
          ))}
        </List>
      </Label>
    );
  }
  return null;
}
