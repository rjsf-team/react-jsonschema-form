import { Box, Card } from '@chakra-ui/react';
import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;

  return (
    <Card.Root mb={2}>
      <Card.Body pb={2}>
        <Box mb={4}>{selector}</Box>
        {optionSchemaField}
      </Card.Body>
    </Card.Root>
  );
}
