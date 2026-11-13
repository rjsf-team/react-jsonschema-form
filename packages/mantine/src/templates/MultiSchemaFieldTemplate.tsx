import { Stack } from '@mantine/core';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Stack style={{ marginBottom: '1rem' }}>
      {selector}
      {optionSchemaField}
    </Stack>
  );
}
