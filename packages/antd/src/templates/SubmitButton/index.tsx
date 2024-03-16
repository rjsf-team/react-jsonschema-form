import { Button, ButtonProps } from 'antd';
import { getSubmitButtonOptions, FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';

type ButtonType = NonNullable<ButtonProps['type']>;

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
