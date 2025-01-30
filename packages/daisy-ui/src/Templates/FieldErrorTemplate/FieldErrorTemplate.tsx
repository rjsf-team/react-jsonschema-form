import { FieldErrorProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldErrorProps<T, S, F>) {
  const { errors } = props;
  return (
    <div className='field-error-template text-red-600'>
      <ul className='list-disc list-inside'>{errors?.map((error, index) => <li key={index}>{error}</li>) ?? []}</ul>
    </div>
  );
}
