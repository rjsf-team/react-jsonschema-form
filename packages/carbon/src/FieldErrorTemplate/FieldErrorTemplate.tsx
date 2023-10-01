import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

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
  console.log('FieldErrorTemplate errors', errors);
  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <>
      {errors.map((error, i: number) => {
        return (
          <div
            key={i}
            id={id}
            className='cds--form-requirement'
            style={{
              // TODO can we use css file?
              // apply the same styles as cds--form-requirement does
              display: 'block',
              fontWeight: '400',
              maxBlockSize: '12.5rem',
              overflow: 'visible',
              color: 'var(--cds-text-error,#da1e28)',
              // FIXME remove margin in input components, NOT HERE
              // there are margin in input components, so we need to remove the margin from the first error
              ...(i === 0 && { marginTop: 0 }),
            }}
          >
            {error}
          </div>
        );
      })}
    </>
  );
}
