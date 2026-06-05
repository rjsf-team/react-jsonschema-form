import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import type { GenericObjectType, FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions, getUiOptions } from '@rjsf/utils';

import { computeSxProps, getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the SubmitButton. */
export interface SubmitButtonMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the SubmitButton. */
  rjsfSlotProps?: {
    /** Props applied to the `Box` wrapper. */
    submitBox?: BoxProps;
    /** Props applied to the `Button` element. */
    submitButton?: ButtonProps;
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
  const { rjsfSlotProps: { submitBox, submitButton } = {}, ...otherMuiProps } = getMuiProps<
    T,
    S,
    F,
    SubmitButtonMuiProps
  >(uiOptions);

  return (
    <Box {...submitBox} sx={computeSxProps<BoxProps>({ mt: 3 }, submitBox)}>
      <Button
        type='submit'
        variant='contained'
        color='primary'
        {...submitButtonProps}
        {...otherMuiProps}
        {...submitButton}
      >
        {submitText}
      </Button>
    </Box>
  );
}
