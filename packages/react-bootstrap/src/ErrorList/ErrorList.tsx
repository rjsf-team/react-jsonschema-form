import type { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Card border='danger' className='mb-4'>
      <Card.Header className='alert-danger'>{translateString(TranslatableString.ErrorsLabel)}</Card.Header>
      <Card.Body className='p-0'>
        <ListGroup>
          {errors.map((error, i: number) => (
            <ListGroup.Item key={i} className='border-0'>
              <span>{error.stack}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
