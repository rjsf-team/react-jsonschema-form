import { Stack } from '@mantine/core';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { SelectorErrorsIdProvider, SelectorFieldIdProvider } from '../utils.tsx';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Stack style={{ marginBottom: '1rem' }}>
      <SelectorFieldIdProvider id={id}>{selector}</SelectorFieldIdProvider>
      {/* Without a selector, such as while an optional field has no data, the option's field renders the errors */}
      <SelectorErrorsIdProvider id={selector ? id : undefined}>{optionSchemaField}</SelectorErrorsIdProvider>
    </Stack>
  );
}
