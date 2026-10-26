import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import type { ButtonProps } from 'antd';
import { Button } from 'antd';

type ButtonType = NonNullable<ButtonProps['type']>;

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button type={'submit' as ButtonType} {...submitButtonProps} htmlType='submit'>
      {submitText}
    </Button>
  );
}
