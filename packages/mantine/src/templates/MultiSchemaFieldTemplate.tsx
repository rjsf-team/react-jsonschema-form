import { Stack } from '@mantine/core';
import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Stack style={{ marginBottom: '1rem' }}>
      {selector}
      {optionSchemaField}
    </Stack>
  );
}
