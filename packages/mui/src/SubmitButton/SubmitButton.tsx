import Box, { BoxProps } from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import {
  getSubmitButtonOptions,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema, registry }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Box marginTop={3} {...(muiSlotProps?.box as BoxProps)}>
      <Button
        type='submit'
        variant='contained'
        color='primary'
        {...submitButtonProps}
        {...(otherMuiProps as ButtonProps)}
        {...(muiSlotProps?.button as ButtonProps)}
      >
        {submitText}
      </Button>
    </Box>
  );
}
