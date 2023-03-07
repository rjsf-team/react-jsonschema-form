import { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema, errorId } from '@rjsf/utils';
import ListGroup from 'react-bootstrap/ListGroup';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <ListGroup as='ul' id={id}>
      {errors.map((error, i) => {
        return (
          <ListGroup.Item as='li' key={i} className='border-0 m-0 p-0'>
            <small className='m-0 text-danger'>{error}</small>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}
