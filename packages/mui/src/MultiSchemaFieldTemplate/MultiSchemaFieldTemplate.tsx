import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { FormControlProps } from '@mui/material/FormControl';
import FormControl from '@mui/material/FormControl';
import type {
  FormContextType,
  GenericObjectType,
  MultiSchemaFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { getUiOptions } from '@rjsf/utils';

import { getMuiProps } from '../util.ts';

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector, uiSchema, registry } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { rjsfSlotProps: muiSlotProps } = getMuiProps<T, S, F, MultiSchemaFieldTemplateMuiProps>(uiOptions);

  return (
    <Box sx={{ mb: 2 }} {...muiSlotProps?.multiBox}>
      {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
      {selector ? (
        <FormControl fullWidth sx={{ mb: 2 }} {...muiSlotProps?.multiFormControl}>
          {selector}
        </FormControl>
      ) : null}
      {optionSchemaField}
    </Box>
  );
}
