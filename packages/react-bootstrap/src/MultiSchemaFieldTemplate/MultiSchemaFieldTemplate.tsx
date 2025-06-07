import { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import Card from 'react-bootstrap/Card';

export default function MultiSchemaFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Card style={{ marginBottom: '1rem' }}>
      <Card.Body>{selector}</Card.Body>
      <Card.Body>{optionSchemaField}</Card.Body>
    </Card>
  );
}
