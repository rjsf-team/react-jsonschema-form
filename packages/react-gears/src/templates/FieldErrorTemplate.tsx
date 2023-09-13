import { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema, errorId } from '@rjsf/utils';
import { ListGroup } from '@appfolio/react-gears';

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
    <ListGroup tag='ul' id={id} type='unstyled'>
      {errors.map((error, i) => {
        return (
          <li key={i}>
            <small className='m-0 text-danger'>{error}</small>
          </li>
        );
      })}
    </ListGroup>
  );
}
