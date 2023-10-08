import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** Implement `FieldErrorTemplate`
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
    <>
      {/* TODO can we use css file? */}
      <style>
        {`
          .error-detail .cds--form-requirement {
            display: block;
            font-weight: 400;
            max-block-size: 12.5rem;
            overflow: visible;
            color: var(--cds-text-error, #da1e28);
          }
        `}
      </style>
      <div className='error-detail'>
        {errors.map((error, i: number) => {
          return (
            <div key={i} id={id} className='cds--form-requirement'>
              {error}
            </div>
          );
        })}
      </div>
    </>
  );
}
