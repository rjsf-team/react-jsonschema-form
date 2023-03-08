import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { getSubmitButtonOptions, FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Box marginTop={3}>
      <Button type='submit' variant='contained' color='primary' {...submitButtonProps}>
        {submitText}
      </Button>
    </Box>
  );
}
