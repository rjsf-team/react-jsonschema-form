import Box, { BoxProps } from '@mui/material/Box';
import FormControl, { FormControlProps } from '@mui/material/FormControl';
import {
  FormContextType,
  GenericObjectType,
  MultiSchemaFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the MultiSchemaFieldTemplate. */
export interface MultiSchemaFieldTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the MultiSchemaFieldTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the wrapper `Box` container. */
    multiBox?: BoxProps;
    /** Props applied to the MUI `FormControl` wrapping the selector. */
    multiFormControl?: FormControlProps;
  };
}

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector, uiSchema } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, MultiSchemaFieldTemplateMuiProps>(uiOptions);

  return (
    <Box sx={{ mb: 2 }} {...muiSlotProps?.multiBox}>
      <FormControl fullWidth sx={{ mb: 2 }} {...muiSlotProps?.multiFormControl}>
        {selector}
      </FormControl>
      {optionSchemaField}
    </Box>
  );
}
