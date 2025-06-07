import Box from '@mui/material/Box';
import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import FormControl from '@mui/material/FormControl';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        {selector}
      </FormControl>
      {optionSchemaField}
    </Box>
  );
}
