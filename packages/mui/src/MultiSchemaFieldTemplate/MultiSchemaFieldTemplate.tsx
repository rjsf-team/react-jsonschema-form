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

/** Properties available for the `slotProps` target of the MultiSchemaFieldTemplate. */
export interface MultiSchemaFieldTemplateMuiProps extends GenericObjectType {
  /** MUI subset property for targeting specific child elements. */
  slotProps?: {
    /** Props applied to the wrapper `Box` container. */
    box?: BoxProps;
    /** Props applied to the MUI `FormControl` wrapping the selector. */
    formControl?: FormControlProps;
  };
}

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector, uiSchema } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F, MultiSchemaFieldTemplateMuiProps>(uiOptions);
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Box sx={{ mb: 2 }} {...otherMuiProps} {...muiSlotProps?.box}>
      <FormControl fullWidth sx={{ mb: 2 }} {...muiSlotProps?.formControl}>
        {selector}
      </FormControl>
      {optionSchemaField}
    </Box>
  );
}
