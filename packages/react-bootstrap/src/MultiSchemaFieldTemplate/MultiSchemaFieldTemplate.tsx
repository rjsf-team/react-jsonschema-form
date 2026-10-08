import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Card } from 'react-bootstrap';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      <Card.Body>{selector}</Card.Body>
      <Card.Body>{optionSchemaField}</Card.Body>
    </Card>
  );
}
