import { Box, Card } from '@chakra-ui/react';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <Card.Root mb={2}>
      <Card.Body pb={2}>
        {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
        {selector ? <Box mb={4}>{selector}</Box> : null}
        {optionSchemaField}
      </Card.Body>
    </Card.Root>
  );
}
