import Box, { BoxProps } from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import {
  getSubmitButtonOptions,
  GenericObjectType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `slotProps` target of the SubmitButton. */
export interface SubmitButtonMuiProps extends GenericObjectType {
  /** MUI subset property for targeting specific child elements. */
  slotProps?: {
    /** Props applied to the `Box` wrapper. */
    box?: BoxProps;
    /** Props applied to the `Button` element. */
    button?: ButtonProps;
  };
}

/** The `SubmitButton` renders a button that represent the `Submit` action on a form
 */
export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F, SubmitButtonMuiProps>(uiOptions);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Box marginTop={3} {...muiSlotProps?.box}>
      <Button
        type='submit'
        variant='contained'
        color='primary'
        {...submitButtonProps}
        {...otherMuiProps}
        {...muiSlotProps?.button}
      >
        {submitText}
      </Button>
    </Box>
  );
}
