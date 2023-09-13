import { Button } from '@appfolio/react-gears';
import { FormContextType, getSubmitButtonOptions, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';

export default function SubmitButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: SubmitButtonProps<T, S, F>
) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions<T, S, F>(props.uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button color='primary' {...submitButtonProps}>
      {submitText}
    </Button>
  );
}
