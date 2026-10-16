import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Card } from 'react-bootstrap';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
      {selector ? <Card.Body>{selector}</Card.Body> : null}
      <Card.Body>{optionSchemaField}</Card.Body>
    </Card>
  );
}
