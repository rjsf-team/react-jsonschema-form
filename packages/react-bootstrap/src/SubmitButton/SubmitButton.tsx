import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import Button from 'react-bootstrap/Button';

export default function SubmitButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: SubmitButtonProps<T, S, F>,
) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions<T, S, F>(props.uiSchema);
  if (norender) {
    return null;
  }
  return (
    <div>
      <Button variant='primary' type='submit' {...submitButtonProps}>
        {submitText}
      </Button>
    </div>
  );
}
