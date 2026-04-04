import Box, { BoxProps } from '@mui/material/Box';
import {
  FormContextType,
  MultiSchemaFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';
import FormControl, { FormControlProps } from '@mui/material/FormControl';
import { getMuiProps } from '../util';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector, uiSchema, registry } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Box sx={{ mb: 2 }} {...(otherMuiProps as BoxProps)} {...(muiSlotProps?.box as BoxProps)}>
      <FormControl fullWidth sx={{ mb: 2 }} {...(muiSlotProps?.formControl as FormControlProps)}>
        {selector}
      </FormControl>
      {optionSchemaField}
    </Box>
  );
}
